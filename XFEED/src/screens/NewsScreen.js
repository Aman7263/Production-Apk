import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { supabase } from "../config/supabase"
import { useTheme } from "../Theme/ThemeContext"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export default function NewsScreen() {
  const { theme } = useTheme()

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [datesWithNews, setDatesWithNews] = useState({})

  // News state
  const [newsItems, setNewsItems] = useState([])
  const [selectedNews, setSelectedNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingNews, setLoadingNews] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Modal state
  const [showNewsModal, setShowNewsModal] = useState(false)
  const [showNewsDetailModal, setShowNewsDetailModal] = useState(false)

  // User state
  const [currentUser, setCurrentUser] = useState(null)
  const [readHistory, setReadHistory] = useState([])

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    initializeScreen()
  }, [])

  useEffect(() => {
    if (currentDate) {
      loadMonthNewsData(currentDate.getFullYear(), currentDate.getMonth())
    }
  }, [currentDate])

  async function initializeScreen() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      if (user) {
        await loadReadHistory(user.id)
      }
      
      await loadMonthNewsData(currentDate.getFullYear(), currentDate.getMonth())
    } catch (error) {
      console.error("Init error:", error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== DATA LOADING ====================

  async function loadMonthNewsData(year, month) {
    try {
      const startDate = new Date(year, month, 1)
      const endDate = new Date(year, month + 1, 0)

      const { data, error } = await supabase
        .from("news_items")
        .select("date")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", endDate.toISOString().split("T")[0])
        .eq("is_published", true)

      if (!error && data) {
        const newsMap = {}
        data.forEach((item) => {
          const dateStr = item.date
          newsMap[dateStr] = (newsMap[dateStr] || 0) + 1
        })
        setDatesWithNews(newsMap)
      }
    } catch (error) {
      console.error("Error loading month news:", error)
    }
  }

  async function loadNewsForDate(date) {
    setLoadingNews(true)
    
    try {
      const dateStr = date.toISOString().split("T")[0]
      
      const { data, error } = await supabase
        .from("news_items")
        .select("*")
        .eq("date", dateStr)
        .eq("is_published", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (!error && data) {
        setNewsItems(data)
      } else {
        setNewsItems([])
      }
    } catch (error) {
      console.error("Error loading news:", error)
      setNewsItems([])
    } finally {
      setLoadingNews(false)
    }
  }

  async function loadReadHistory(userId) {
    try {
      const { data } = await supabase
        .from("news_read_history")
        .select("news_id")
        .eq("user_id", userId)

      if (data) {
        setReadHistory(data.map(item => item.news_id))
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  // ==================== NEWS FUNCTIONS ====================

  async function markAsRead(newsId) {
    if (!currentUser || readHistory.includes(newsId)) return

    try {
      await supabase.from("news_read_history").insert({
        user_id: currentUser.id,
        news_id: newsId,
      })

      // Increment view count
      await supabase.rpc("increment_news_views", { news_id: newsId })

      setReadHistory([...readHistory, newsId])
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  async function generateTodayNews() {
    const today = new Date().toISOString().split("T")[0]

    try {
      // Check if news already exists for today
      const { data: existing } = await supabase
        .from("news_items")
        .select("id")
        .eq("date", today)
        .limit(1)

      if (existing && existing.length > 0) {
        Alert.alert("Info", "News for today already exists!")
        return
      }

      // Sample news generation (replace with your actual news API)
      const sampleNews = [
        {
          date: today,
          title: "Breaking: Major Technology Announcement",
          content: "Today marks a significant milestone in the technology sector as major companies announce new innovations that will shape the future...",
          summary: "Major tech companies announce groundbreaking innovations",
          category: "technology",
          image_url: "https://picsum.photos/800/400?random=1",
          source: "Tech Daily",
          author_id: currentUser?.id,
          priority: 1,
        },
        {
          date: today,
          title: "Global Markets Update",
          content: "Financial markets around the world showed mixed results today as investors react to economic indicators...",
          summary: "Markets show mixed results amid economic changes",
          category: "finance",
          image_url: "https://picsum.photos/800/400?random=2",
          source: "Finance Weekly",
          author_id: currentUser?.id,
          priority: 2,
        },
        {
          date: today,
          title: "Sports Highlights of the Day",
          content: "Exciting matches and incredible performances defined today's sports action across multiple leagues...",
          summary: "Exciting sports action across multiple leagues",
          category: "sports",
          image_url: "https://picsum.photos/800/400?random=3",
          source: "Sports Central",
          author_id: currentUser?.id,
          priority: 3,
        },
      ]

      const { error } = await supabase.from("news_items").insert(sampleNews)

      if (error) throw error

      Alert.alert("Success", "Today's news has been generated!")
      
      // Refresh calendar
      await loadMonthNewsData(currentDate.getFullYear(), currentDate.getMonth())
      
      // If today is selected, reload news
      if (selectedDate && selectedDate.toISOString().split("T")[0] === today) {
        await loadNewsForDate(selectedDate)
      }
    } catch (error) {
      Alert.alert("Error", error.message)
    }
  }

  // ==================== CALENDAR FUNCTIONS ====================

  function getCalendarDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days = []

    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split("T")[0]
      days.push({
        day: i,
        isCurrentMonth: true,
        date,
        hasNews: !!datesWithNews[dateStr],
        newsCount: datesWithNews[dateStr] || 0,
        isToday: dateStr === new Date().toISOString().split("T")[0],
      })
    }

    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      })
    }

    return days
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function handleDatePress(dateObj) {
    if (!dateObj.isCurrentMonth) return
    
    setSelectedDate(dateObj.date)
    loadNewsForDate(dateObj.date)
    setShowNewsModal(true)
  }

  function openNewsDetail(news) {
    setSelectedNews(news)
    markAsRead(news.id)
    setShowNewsDetailModal(true)
  }

  function onRefresh() {
    setRefreshing(true)
    loadMonthNewsData(currentDate.getFullYear(), currentDate.getMonth())
      .finally(() => setRefreshing(false))
  }

  // ==================== RENDER FUNCTIONS ====================

  function renderCalendarHeader() {
    return (
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#4A90E2" />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.monthYearContainer}>
          <Text style={styles.monthYearText}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <Text style={styles.todayHint}>Tap to go to today</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    )
  }

  function renderWeekdays() {
    return (
      <View style={styles.weekdaysContainer}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayItem}>
            <Text style={[
              styles.weekdayText,
              (index === 0 || index === 6) && styles.weekendText
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  function renderCalendarDays() {
    const days = getCalendarDays()
    const weeks = []
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <View style={styles.daysContainer}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((dateObj, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayItem,
                  !dateObj.isCurrentMonth && styles.otherMonthDay,
                  dateObj.isToday && styles.todayItem,
                  dateObj.hasNews && styles.hasNewsItem,
                ]}
                onPress={() => handleDatePress(dateObj)}
                disabled={!dateObj.isCurrentMonth}
              >
                <Text style={[
                  styles.dayText,
                  !dateObj.isCurrentMonth && styles.otherMonthDayText,
                  dateObj.isToday && styles.todayText,
                  dateObj.hasNews && styles.hasNewsText,
                ]}>
                  {dateObj.day}
                </Text>
                
                {dateObj.hasNews && (
                  <View style={styles.newsDot}>
                    {dateObj.newsCount > 1 && (
                      <Text style={styles.newsCountText}>{dateObj.newsCount}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    )
  }

  function renderNewsItem({ item }) {
    const isRead = readHistory.includes(item.id)
    
    return (
      <TouchableOpacity
        style={[styles.newsItem, isRead && styles.readNewsItem]}
        onPress={() => openNewsDetail(item)}
        activeOpacity={0.7}
      >
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.newsContent}>
          <View style={styles.newsHeader}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) }
            ]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            {isRead && (
              <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />
            )}
          </View>
          
          <Text style={styles.newsTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          <Text style={styles.newsSummary} numberOfLines={2}>
            {item.summary || item.content.substring(0, 100)}
          </Text>
          
          <View style={styles.newsFooter}>
            <Text style={styles.newsSource}>{item.source}</Text>
            <Text style={styles.newsTime}>
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  function getCategoryColor(category) {
    const colors = {
      technology: "#4A90E2",
      finance: "#2ECC71",
      sports: "#E74C3C",
      entertainment: "#9B59B6",
      health: "#1ABC9C",
      politics: "#E67E22",
      general: "#95A5A6",
    }
    return colors[category] || colors.general
  }

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    )
  }

  return (
    <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📰 Daily News</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateTodayNews}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.generateButtonText}>Generate Today</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <ScrollView
        style={styles.calendarContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.calendarCard}>
          {renderCalendarHeader()}
          {renderWeekdays()}
          {renderCalendarDays()}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#4A90E2" }]} />
            <Text style={styles.legendText}>Has News</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#2ECC71" }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#4A90E2" />
          <Text style={styles.instructionsText}>
            Tap on any date with a dot to view news for that day
          </Text>
        </View>
      </ScrollView>

      {/* News List Modal */}
      <Modal
        visible={showNewsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.newsModalContent}>
            {/* Modal Header */}
            <View style={styles.newsModalHeader}>
              <View>
                <Text style={styles.newsModalTitle}>
                  {selectedDate?.toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </Text>
                <Text style={styles.newsModalSubtitle}>
                  {newsItems.length} {newsItems.length === 1 ? "article" : "articles"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowNewsModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* News List */}
            {loadingNews ? (
              <View style={styles.loadingNewsContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingNewsText}>Loading news...</Text>
              </View>
            ) : newsItems.length > 0 ? (
              <FlatList
                data={newsItems}
                keyExtractor={(item) => item.id}
                renderItem={renderNewsItem}
                contentContainerStyle={styles.newsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noNewsContainer}>
                <Ionicons name="newspaper-outline" size={60} color="#ccc" />
                <Text style={styles.noNewsText}>No news for this date</Text>
                <Text style={styles.noNewsSubtext}>
                  Check back later or select another date
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* News Detail Modal */}
      <Modal
        visible={showNewsDetailModal}
        animationType="slide"
        onRequestClose={() => setShowNewsDetailModal(false)}
      >
        <View style={styles.detailModalContainer}>
          {/* Detail Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowNewsDetailModal(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>News Detail</Text>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          {selectedNews && (
            <ScrollView style={styles.detailContent}>
              {/* Image */}
              {selectedNews.image_url && (
                <Image
                  source={{ uri: selectedNews.image_url }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              )}

              {/* Category & Date */}
              <View style={styles.detailMeta}>
                <View style={[
                  styles.detailCategoryBadge,
                  { backgroundColor: getCategoryColor(selectedNews.category) }
                ]}>
                  <Text style={styles.detailCategoryText}>
                    {selectedNews.category}
                  </Text>
                </View>
                <Text style={styles.detailDate}>
                  {new Date(selectedNews.date).toLocaleDateString([], {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.detailTitle}>{selectedNews.title}</Text>

              {/* Source */}
              <View style={styles.sourceContainer}>
                <Ionicons name="globe-outline" size={16} color="#666" />
                <Text style={styles.sourceText}>{selectedNews.source}</Text>
                <Text style={styles.timeText}>
                  • {new Date(selectedNews.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </Text>
              </View>

              {/* Content */}
              <Text style={styles.detailContentText}>
                {selectedNews.content}
              </Text>

              {/* Views */}
              <View style={styles.viewsContainer}>
                <Ionicons name="eye-outline" size={16} color="#999" />
                <Text style={styles.viewsText}>
                  {selectedNews.views_count} views
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  generateButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  calendarContainer: {
    flex: 1,
    padding: 15,
  },
  calendarCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  monthYearContainer: {
    alignItems: "center",
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  todayHint: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  weekdaysContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  weekendText: {
    color: "#E74C3C",
  },
  daysContainer: {
    marginTop: 5,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  dayItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    margin: 2,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayItem: {
    backgroundColor: "#2ECC71",
  },
  hasNewsItem: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#4A90E2",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  otherMonthDayText: {
    color: "#ccc",
  },
  todayText: {
    color: "white",
    fontWeight: "bold",
  },
  hasNewsText: {
    color: "#4A90E2",
    fontWeight: "bold",
  },
  newsDot: {
    position: "absolute",
    bottom: 5,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  newsCountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginTop: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#666",
  },
  instructionsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 15,
    marginTop: 15,
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: "#4A90E2",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  newsModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.85,
    paddingBottom: 20,
  },
  newsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  newsModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  newsModalSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    padding: 5,
  },
  loadingNewsContainer: {
    padding: 50,
    alignItems: "center",
  },
  loadingNewsText: {
    marginTop: 10,
    color: "#666",
  },
  newsList: {
    padding: 15,
  },
  newsItem: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    overflow: "hidden",
  },
  readNewsItem: {
    opacity: 0.7,
  },
  newsImage: {
    width: "100%",
    height: 150,
  },
  newsContent: {
    padding: 15,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
    lineHeight: 22,
  },
  newsSummary: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
    marginBottom: 10,
  },
  newsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newsSource: {
    fontSize: 12,
    color: "#4A90E2",
    fontWeight: "500",
  },
  newsTime: {
    fontSize: 12,
    color: "#999",
  },
  noNewsContainer: {
    alignItems: "center",
    padding: 50,
  },
  noNewsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  noNewsSubtext: {
    fontSize: 13,
    color: "#999",
    marginTop: 5,
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  shareButton: {
    padding: 5,
  },
  detailContent: {
    flex: 1,
  },
  detailImage: {
    width: "100%",
    height: 220,
  },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 15,
  },
  detailCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  detailCategoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detailDate: {
    fontSize: 13,
    color: "#666",
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    lineHeight: 32,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10,
    gap: 6,
  },
  sourceText: {
    fontSize: 13,
    color: "#4A90E2",
    fontWeight: "500",
  },
  timeText: {
    fontSize: 13,
    color: "#999",
  },
  detailContentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    padding: 20,
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 6,
  },
  viewsText: {
    fontSize: 13,
    color: "#999",
  },
})
import { supabase } from "./supabase";
import { askGemini } from "./geminiService";

/**
 * Centralized API handler for TheAmreyWorld
 */
export const API = {
  // --- AUTH ---
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  updateAuth: async (data) => {
    const { data: updated, error } = await supabase.auth.updateUser(data);
    if (error) throw error;
    return updated;
  },

  // --- PARTNERS ---
  getPartnerProfile: async (userId) => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  getPartnerByPartnerId: async (partnerId) => {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("partner_id", partnerId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  createPartner: async (userId, partnerId) => {
    const { data, error } = await supabase
      .from("partners")
      .insert([{ user_id: userId, partner_id: partnerId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updatePartnerLink: async (userId, linkedId) => {
    const { data, error } = await supabase
      .from("partners")
      .update({ linked_id: linkedId })
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- MESSAGES ---
  getMessages: async (partnerId, linkedId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`partner_id.eq.${partnerId},partner_id.eq.${linkedId}`)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },

  sendMessage: async (content, senderId, partnerId, imageUrl = null) => {
    const payload = {
      content,
      sender_id: senderId,
      partner_id: partnerId,
      image_url: imageUrl,
    };
    const { data, error } = await supabase.from("messages").insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  deleteMessage: async (id, deletedText) => {
    const { data, error } = await supabase
      .from("messages")
      .update({ content: deletedText, image_url: null, is_deleted: true })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateMessageReactions: async (id, reactions) => {
    const { data, error } = await supabase
      .from("messages")
      .update({ reactions })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // --- LOCATIONS ---
  getLocations: async (ids) => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .in("partner_tagged_id", ids);
    if (error) throw error;
    return data || [];
  },

  saveLocation: async (payload) => {
    const { data, error } = await supabase
      .from("locations")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteLocation: async (id) => {
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  sendNotification: async (payload) => {
    const { data, error } = await supabase.from("notifications").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  updateNotificationStatus: async (id, status) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  markMessagesAsRead: async (unreadIds) => {
    const { data, error } = await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
    if (error) throw error;
    return data;
  },

  // --- PAYMENTS ---
  getPaymentStatus: async (userId) => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed");
    if (error) throw error;
    return data && data.length > 0;
  },

  getPaymentHistory: async (userId) => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  createPayment: async (payload) => {
    const { data, error } = await supabase.from("payments").insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  // --- TRACKING ---
  updateLiveLocation: async (payload) => {
    const { data, error } = await supabase
      .from('live_tracking')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getPartnerLiveLocation: async (linkedId) => {
    const { data, error } = await supabase
      .from('live_tracking')
      .select('*')
      .eq('partner_id', linkedId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  // --- AI ---
  askAI: async (prompt) => {
    return await askGemini(prompt);
  },

  // --- STORAGE ---
  createSignedUrl: async (path, expiry = 60) => {
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, expiry);
    if (error) throw error;
    return data.signedUrl;
  },

  uploadAvatar: async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop();
      const fileName = `${userId}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;
      return fileName;
    } catch (error) {
      console.error("Avatar upload failed:", error.message);
      throw error;
    }
  },

  uploadMedia: async (uri, name, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileExt = name.split(".").pop();
      const fileName = `media_${userId}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          contentType: blob.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return publicUrl;
    } catch (error) {
      console.error("Upload failed in API:", error.message);
      throw error;
    }
  },
};

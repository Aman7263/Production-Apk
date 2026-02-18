import React from "react"
import { View, Text } from "react-native"
import { COLORS } from "../utils/constants"
import { formatDate } from "../utils/helpers"

export default function NewsCard({ item }) {

  return (

    <View
      style={{
        backgroundColor: COLORS.white,
        padding: 15,
        marginVertical: 8,
        borderRadius: 8
      }}
    >

      <Text style={{ fontWeight: "bold" }}>
        {formatDate(item.date)}
      </Text>

      <Text style={{ marginTop: 5 }}>
        {item.content}
      </Text>

    </View>

  )
}
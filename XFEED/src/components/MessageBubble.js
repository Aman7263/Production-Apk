import React from "react"
import { View, Text } from "react-native"
import { COLORS } from "../utils/constants"

export default function MessageBubble({ message, isMe }) {

  return (

    <View
      style={{
        alignSelf: isMe ? "flex-end" : "flex-start",
        backgroundColor: isMe ? COLORS.primary : "#e2e8f0",
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        maxWidth: "70%"
      }}
    >

      <Text style={{
        color: isMe ? "white" : "black"
      }}>
        {message.message}
      </Text>

    </View>

  )
}
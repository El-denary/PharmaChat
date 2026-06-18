import axios from "axios"

const BASE_URL = "http://localhost:8000"

export async function createConversation() {
    const response = await axios.post(`${BASE_URL}/conversation`)
    return response.data.conversation_id
}

export async function getConversations() {
    const response = await axios.get(`${BASE_URL}/conversations`)
    return response.data.conversations
}

export async function getMessages(conversationId) {
    const response = await axios.get(`${BASE_URL}/conversations/${conversationId}/messages`)
    return response.data.messages
}

export async function deleteConversation(conversationId) {
    const response = await axios.delete(`${BASE_URL}/conversations/${conversationId}`)
    return response.data
}

export async function sendMessage(text, imageFile, conversationId) {
    let image_base64 = null
    if (imageFile) {
        image_base64 = await toBase64(imageFile)
    }

    const response = await axios.post(`${BASE_URL}/chat`, {
        query: text || null,
        image_base64: image_base64,
        conversation_id: conversationId,
    })

    return response.data.response
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const base64 = reader.result.split(",")[1]
            resolve(base64)
        }
        reader.onerror = reject
    })
}
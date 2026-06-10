package com.khoaluan.backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.document.MetadataMode;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ai.openai.api.OpenAiApi;

@Configuration
public class SpringAiConfig {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Bean
    public OpenAiApi geminiOpenAiApi() {
        // Sử dụng Gemini OpenAI-compatible API
        return new OpenAiApi("https://generativelanguage.googleapis.com/v1beta/openai/", geminiApiKey);
    }

    @Bean
    public OpenAiChatModel geminiChatModel(OpenAiApi geminiOpenAiApi) {
        return new OpenAiChatModel(geminiOpenAiApi);
    }

    @Bean
    public OpenAiEmbeddingModel geminiEmbeddingModel(OpenAiApi geminiOpenAiApi) {
        // Sử dụng model gemini-embedding-2 của Gemini (kích thước 768 chiều tương thích Qdrant)
        return new OpenAiEmbeddingModel(geminiOpenAiApi,
                MetadataMode.ALL,
                OpenAiEmbeddingOptions.builder()
                        .withModel("gemini-embedding-2")
                        .withDimensions(768)
                        .build());
    }

    @Bean(name = "flashChatClient")
    public ChatClient flashChatClient(OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultOptions(OpenAiChatOptions.builder()
                        .withModel("gemini-2.5-flash")
                        .withTemperature(0.2)
                        .build())
                .build();
    }

    @Bean(name = "proChatClient")
    public ChatClient proChatClient(OpenAiChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultOptions(OpenAiChatOptions.builder()
                        .withModel("gemini-2.5-pro")
                        .withTemperature(0.7)
                        .build())
                .build();
    }
}

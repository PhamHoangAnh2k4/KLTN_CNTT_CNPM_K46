package com.khoaluan.backend.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.web.client.RestClient;

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

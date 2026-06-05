package com.khoaluan.backend.service;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import io.qdrant.client.grpc.Points.PointId;
import com.google.protobuf.Value;
import io.qdrant.client.ValueFactory;
import io.qdrant.client.grpc.Points.Vectors;
import io.qdrant.client.grpc.Points.Vector;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QdrantService {

    @org.springframework.beans.factory.annotation.Value("${qdrant.host:localhost}")
    private String host;

    @org.springframework.beans.factory.annotation.Value("${qdrant.port:6334}")
    private int port;

    private QdrantClient client;

    public static final String CV_COLLECTION = "candidate_cvs";
    public static final String JOB_COLLECTION = "job_postings";
    public static final int EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004

    @PostConstruct
    public void init() {
        try {
            System.out.println("🔌 Đang khởi tạo kết nối Qdrant gRPC tới " + host + ":" + port);
            client = new QdrantClient(
                QdrantGrpcClient.newBuilder(host, port, false).build()
            );
            
            // Tự động khởi tạo các collection cần thiết
            initCollection(CV_COLLECTION);
            initCollection(JOB_COLLECTION);
            System.out.println("✅ Khởi tạo các collections Qdrant thành công!");
        } catch (Exception e) {
            System.err.println("❌ Không thể kết nối tới Qdrant DB: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void initCollection(String collectionName) {
        try {
            boolean exists = client.listCollectionsAsync().get().contains(collectionName);
            if (!exists) {
                System.out.println("🆕 Tạo mới collection: " + collectionName);
                client.createCollectionAsync(collectionName,
                    VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(EMBEDDING_DIMENSION).build()
                ).get();
            } else {
                System.out.println("✔ Collection đã tồn tại: " + collectionName);
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi khởi tạo collection " + collectionName + ": " + e.getMessage());
        }
    }

    /**
     * Tải vector CV lên Qdrant
     */
    public void upsertCvVector(Long cvId, List<Float> vector, Map<String, String> metadata) {
        try {
            PointStruct point = buildPoint(cvId, vector, metadata);
            client.upsertAsync(CV_COLLECTION, List.of(point)).get();
            System.out.println("💾 Đã lưu Vector CV ID " + cvId + " vào Qdrant.");
        } catch (Exception e) {
            System.err.println("❌ Lỗi lưu Vector CV: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Tải vector Job lên Qdrant
     */
    public void upsertJobVector(Long jobId, List<Float> vector, Map<String, String> metadata) {
        try {
            PointStruct point = buildPoint(jobId, vector, metadata);
            client.upsertAsync(JOB_COLLECTION, List.of(point)).get();
            System.out.println("💾 Đã lưu Vector Job ID " + jobId + " vào Qdrant.");
        } catch (Exception e) {
            System.err.println("❌ Lỗi lưu Vector Job: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Tìm kiếm CV phù hợp nhất cho 1 Job
     */
    public List<ScoredPoint> searchSimilarCvs(List<Float> jobVector, int limit) {
        try {
            return client.searchAsync(
                SearchPoints.newBuilder()
                    .setCollectionName(CV_COLLECTION)
                    .addAllVector(jobVector)
                    .setWithPayload(io.qdrant.client.grpc.Points.WithPayloadSelector.newBuilder().setEnable(true).build())
                    .setLimit(limit)
                    .build()
            ).get();
        } catch (Exception e) {
            System.err.println("❌ Lỗi tìm kiếm CV trên Qdrant: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Tìm kiếm Job phù hợp nhất cho 1 CV
     */
    public List<ScoredPoint> searchSimilarJobs(List<Float> cvVector, int limit) {
        try {
            return client.searchAsync(
                SearchPoints.newBuilder()
                    .setCollectionName(JOB_COLLECTION)
                    .addAllVector(cvVector)
                    .setWithPayload(io.qdrant.client.grpc.Points.WithPayloadSelector.newBuilder().setEnable(true).build())
                    .setLimit(limit)
                    .build()
            ).get();
        } catch (Exception e) {
            System.err.println("❌ Lỗi tìm kiếm Job trên Qdrant: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Lấy vector CV đã lưu trong Qdrant theo userId (để tránh OCR lại)
     * Trả về null nếu chưa có
     */
    public List<Float> getCachedCvVector(Long userId) {
        try {
            var result = client.retrieveAsync(
                CV_COLLECTION,
                List.of(PointId.newBuilder().setNum(userId).build()),
                false, // withPayload
                true,  // withVectors
                null   // readConsistency
            ).get();
            if (result != null && !result.isEmpty()) {
                List<Float> vec = new ArrayList<>(result.get(0).getVectors().getVector().getDataList());
                if (!vec.isEmpty()) {
                    System.out.println("⚡ [Qdrant] Dùng cached CV vector cho user " + userId);
                    return vec;
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Không lấy được cached vector: " + e.getMessage());
        }
        return null;
    }

    private PointStruct buildPoint(Long id, List<Float> vectorData, Map<String, String> metadata) {
        PointId pointId = PointId.newBuilder().setNum(id).build();
        
        Vector.Builder vectorBuilder = Vector.newBuilder().addAllData(vectorData);
        Vectors vectors = Vectors.newBuilder().setVector(vectorBuilder.build()).build();
        
        PointStruct.Builder pointBuilder = PointStruct.newBuilder()
            .setId(pointId)
            .setVectors(vectors);
            
        if (metadata != null) {
            for (Map.Entry<String, String> entry : metadata.entrySet()) {
                if (entry.getValue() != null) {
                    pointBuilder.putPayload(entry.getKey(), 
                        ValueFactory.value(entry.getValue()));
                }
            }
        }
        
        return pointBuilder.build();
    }

    @PreDestroy
    public void close() {
        if (client != null) {
            System.out.println("🔌 Đóng kết nối Qdrant Client...");
            client.close();
        }
    }
}

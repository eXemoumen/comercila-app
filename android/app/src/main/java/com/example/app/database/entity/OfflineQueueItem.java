package com.example.app.database.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.ColumnInfo;
import androidx.room.TypeConverters;

import com.example.app.database.converter.DateConverter;

import java.util.Date;

@Entity(tableName = "offline_queue")
@TypeConverters(DateConverter.class)
public class OfflineQueueItem {
    @PrimaryKey(autoGenerate = true)
    public int id;
    
    @ColumnInfo(name = "operation_type")
    public String operationType; // "CREATE", "UPDATE", "DELETE"
    
    @ColumnInfo(name = "table_name")
    public String tableName; // "sales", "orders", "stock", "supermarkets"
    
    @ColumnInfo(name = "record_id")
    public String recordId;
    
    @ColumnInfo(name = "data")
    public String data; // JSON string of the data
    
    @ColumnInfo(name = "created_at")
    public Date createdAt;
    
    @ColumnInfo(name = "retry_count")
    public int retryCount;
    
    @ColumnInfo(name = "last_retry")
    public Date lastRetry;
    
    @ColumnInfo(name = "status")
    public String status; // "pending", "processing", "completed", "failed"
    
    @ColumnInfo(name = "error_message")
    public String errorMessage;
    
    @ColumnInfo(name = "priority")
    public int priority; // 1 = high, 2 = medium, 3 = low
}

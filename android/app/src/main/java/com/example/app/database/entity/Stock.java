package com.example.app.database.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.ColumnInfo;
import androidx.room.TypeConverters;
import androidx.annotation.NonNull;

import com.example.app.database.converter.DateConverter;
import com.example.app.database.converter.JsonConverter;

import java.util.Date;
import java.util.Map;

@Entity(tableName = "stock")
@TypeConverters({DateConverter.class, JsonConverter.class})
public class Stock {
    @PrimaryKey
    @NonNull
    public String id;
    
    @ColumnInfo(name = "date")
    public Date date;
    
    @ColumnInfo(name = "type")
    public String type; // "added", "removed", "adjusted"
    
    @ColumnInfo(name = "quantity")
    public int quantity;
    
    @ColumnInfo(name = "current_stock")
    public int currentStock;
    
    @ColumnInfo(name = "reason")
    public String reason;
    
    @ColumnInfo(name = "fragrance_distribution")
    public Map<String, Integer> fragranceDistribution;
    
    @ColumnInfo(name = "created_at")
    public Date createdAt;
    
    @ColumnInfo(name = "updated_at")
    public Date updatedAt;
    
    @ColumnInfo(name = "sync_status")
    public String syncStatus; // "synced", "pending", "failed"
    
    @ColumnInfo(name = "last_sync_attempt")
    public Date lastSyncAttempt;
}

package com.example.app.database.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.ColumnInfo;
import androidx.room.TypeConverters;
import androidx.annotation.NonNull;

import com.example.app.database.converter.DateConverter;

import java.util.Date;

@Entity(tableName = "orders")
@TypeConverters(DateConverter.class)
public class Order {
    @PrimaryKey
    @NonNull
    public String id;
    
    @ColumnInfo(name = "supermarket_id")
    public String supermarketId;
    
    @ColumnInfo(name = "date")
    public Date date;
    
    @ColumnInfo(name = "quantity")
    public int quantity;
    
    @ColumnInfo(name = "status")
    public String status; // "pending", "delivered", "cancelled"
    
    @ColumnInfo(name = "price_per_unit")
    public double pricePerUnit;
    
    @ColumnInfo(name = "created_at")
    public Date createdAt;
    
    @ColumnInfo(name = "updated_at")
    public Date updatedAt;
    
    @ColumnInfo(name = "sync_status")
    public String syncStatus; // "synced", "pending", "failed"
    
    @ColumnInfo(name = "last_sync_attempt")
    public Date lastSyncAttempt;
}

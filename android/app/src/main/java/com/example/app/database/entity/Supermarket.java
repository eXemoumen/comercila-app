package com.example.app.database.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.room.ColumnInfo;
import androidx.room.TypeConverters;
import androidx.annotation.NonNull;

import com.example.app.database.converter.JsonConverter;
import com.example.app.database.converter.DateConverter;

import java.util.Date;
import java.util.List;

@Entity(tableName = "supermarkets")
@TypeConverters({JsonConverter.class, DateConverter.class})
public class Supermarket {
    @PrimaryKey
    @NonNull
    public String id;
    
    @ColumnInfo(name = "name")
    public String name;
    
    @ColumnInfo(name = "address")
    public String address;
    
    @ColumnInfo(name = "latitude")
    public double latitude;
    
    @ColumnInfo(name = "longitude")
    public double longitude;
    
    @ColumnInfo(name = "email")
    public String email;
    
    @ColumnInfo(name = "phone_numbers")
    public List<JsonConverter.PhoneNumber> phoneNumbers;
    
    @ColumnInfo(name = "created_at")
    public Date createdAt;
    
    @ColumnInfo(name = "updated_at")
    public Date updatedAt;
    
    @ColumnInfo(name = "sync_status")
    public String syncStatus; // "synced", "pending", "failed"
    
    @ColumnInfo(name = "last_sync_attempt")
    public Date lastSyncAttempt;
}

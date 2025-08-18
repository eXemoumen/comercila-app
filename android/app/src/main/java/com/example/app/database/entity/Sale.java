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

@Entity(tableName = "sales")
@TypeConverters({DateConverter.class, JsonConverter.class})
public class Sale {
    @PrimaryKey
    @NonNull
    public String id;
    
    @ColumnInfo(name = "supermarket_id")
    public String supermarketId;
    
    @ColumnInfo(name = "date")
    public Date date;
    
    @ColumnInfo(name = "quantity")
    public int quantity;
    
    @ColumnInfo(name = "cartons")
    public int cartons;
    
    @ColumnInfo(name = "price_per_unit")
    public double pricePerUnit;
    
    @ColumnInfo(name = "total_value")
    public double totalValue;
    
    @ColumnInfo(name = "is_paid")
    public boolean isPaid;
    
    @ColumnInfo(name = "payment_date")
    public Date paymentDate;
    
    @ColumnInfo(name = "payment_note")
    public String paymentNote;
    
    @ColumnInfo(name = "expected_payment_date")
    public Date expectedPaymentDate;
    
    @ColumnInfo(name = "remaining_amount")
    public double remainingAmount;
    
    @ColumnInfo(name = "from_order")
    public boolean fromOrder;
    
    @ColumnInfo(name = "note")
    public String note;
    
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

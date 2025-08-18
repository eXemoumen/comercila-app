package com.example.app.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.example.app.database.entity.Stock;

import java.util.List;

@Dao
public interface StockDao {
    @Query("SELECT * FROM stock ORDER BY date DESC")
    List<Stock> getAllStock();
    
    @Query("SELECT * FROM stock WHERE sync_status = :status")
    List<Stock> getStockBySyncStatus(String status);
    
    @Query("SELECT * FROM stock WHERE id = :id")
    Stock getStockById(String id);
    
    @Query("SELECT * FROM stock WHERE type = :type")
    List<Stock> getStockByType(String type);
    
    @Query("SELECT * FROM stock ORDER BY date DESC LIMIT 1")
    Stock getLatestStock();
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertStock(Stock stock);
    
    @Update
    void updateStock(Stock stock);
    
    @Delete
    void deleteStock(Stock stock);
    
    @Query("DELETE FROM stock WHERE id = :id")
    void deleteStockById(String id);
    
    @Query("UPDATE stock SET sync_status = :status WHERE id = :id")
    void updateSyncStatus(String id, String status);
    
    @Query("SELECT COUNT(*) FROM stock WHERE sync_status = 'pending'")
    int getPendingSyncCount();
}


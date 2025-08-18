package com.example.app.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.example.app.database.entity.Sale;

import java.util.List;

@Dao
public interface SaleDao {
    @Query("SELECT * FROM sales ORDER BY date DESC")
    List<Sale> getAllSales();
    
    @Query("SELECT * FROM sales WHERE sync_status = :status")
    List<Sale> getSalesBySyncStatus(String status);
    
    @Query("SELECT * FROM sales WHERE id = :id")
    Sale getSaleById(String id);
    
    @Query("SELECT * FROM sales WHERE supermarket_id = :supermarketId")
    List<Sale> getSalesBySupermarket(String supermarketId);
    
    @Query("SELECT * FROM sales WHERE is_paid = 0")
    List<Sale> getUnpaidSales();
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertSale(Sale sale);
    
    @Update
    void updateSale(Sale sale);
    
    @Delete
    void deleteSale(Sale sale);
    
    @Query("DELETE FROM sales WHERE id = :id")
    void deleteSaleById(String id);
    
    @Query("UPDATE sales SET sync_status = :status WHERE id = :id")
    void updateSyncStatus(String id, String status);
    
    @Query("SELECT COUNT(*) FROM sales WHERE sync_status = 'pending'")
    int getPendingSyncCount();
}


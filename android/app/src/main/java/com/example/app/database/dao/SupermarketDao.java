package com.example.app.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.example.app.database.entity.Supermarket;

import java.util.List;

@Dao
public interface SupermarketDao {
    @Query("SELECT * FROM supermarkets ORDER BY name ASC")
    List<Supermarket> getAllSupermarkets();
    
    @Query("SELECT * FROM supermarkets WHERE sync_status = :status")
    List<Supermarket> getSupermarketsBySyncStatus(String status);
    
    @Query("SELECT * FROM supermarkets WHERE id = :id")
    Supermarket getSupermarketById(String id);
    
    @Query("SELECT * FROM supermarkets WHERE name LIKE '%' || :searchTerm || '%'")
    List<Supermarket> searchSupermarkets(String searchTerm);
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertSupermarket(Supermarket supermarket);
    
    @Update
    void updateSupermarket(Supermarket supermarket);
    
    @Delete
    void deleteSupermarket(Supermarket supermarket);
    
    @Query("DELETE FROM supermarkets WHERE id = :id")
    void deleteSupermarketById(String id);
    
    @Query("UPDATE supermarkets SET sync_status = :status WHERE id = :id")
    void updateSyncStatus(String id, String status);
    
    @Query("SELECT COUNT(*) FROM supermarkets WHERE sync_status = 'pending'")
    int getPendingSyncCount();
}



package com.example.app.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.example.app.database.entity.Order;

import java.util.List;

@Dao
public interface OrderDao {
    @Query("SELECT * FROM orders ORDER BY date DESC")
    List<Order> getAllOrders();
    
    @Query("SELECT * FROM orders WHERE sync_status = :status")
    List<Order> getOrdersBySyncStatus(String status);
    
    @Query("SELECT * FROM orders WHERE id = :id")
    Order getOrderById(String id);
    
    @Query("SELECT * FROM orders WHERE supermarket_id = :supermarketId")
    List<Order> getOrdersBySupermarket(String supermarketId);
    
    @Query("SELECT * FROM orders WHERE status = :status")
    List<Order> getOrdersByStatus(String status);
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertOrder(Order order);
    
    @Update
    void updateOrder(Order order);
    
    @Delete
    void deleteOrder(Order order);
    
    @Query("DELETE FROM orders WHERE id = :id")
    void deleteOrderById(String id);
    
    @Query("UPDATE orders SET sync_status = :status WHERE id = :id")
    void updateSyncStatus(String id, String status);
    
    @Query("SELECT COUNT(*) FROM orders WHERE sync_status = 'pending'")
    int getPendingSyncCount();
}



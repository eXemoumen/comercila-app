package com.example.app.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.example.app.database.entity.OfflineQueueItem;

import java.util.List;

@Dao
public interface OfflineQueueDao {
    @Query("SELECT * FROM offline_queue WHERE status = 'pending' ORDER BY priority ASC, created_at ASC")
    List<OfflineQueueItem> getPendingItems();
    
    @Query("SELECT * FROM offline_queue WHERE status = :status")
    List<OfflineQueueItem> getItemsByStatus(String status);
    
    @Query("SELECT * FROM offline_queue WHERE table_name = :tableName AND record_id = :recordId")
    List<OfflineQueueItem> getItemsByTableAndRecord(String tableName, String recordId);
    
    @Query("SELECT COUNT(*) FROM offline_queue WHERE status = 'pending'")
    int getPendingCount();
    
    @Query("SELECT COUNT(*) FROM offline_queue WHERE status = 'failed'")
    int getFailedCount();
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertItem(OfflineQueueItem item);
    
    @Update
    void updateItem(OfflineQueueItem item);
    
    @Delete
    void deleteItem(OfflineQueueItem item);
    
    @Query("DELETE FROM offline_queue WHERE status = 'completed'")
    void deleteCompletedItems();
    
    @Query("UPDATE offline_queue SET status = :status, retry_count = retry_count + 1, last_retry = :lastRetry WHERE id = :id")
    void updateRetryStatus(int id, String status, long lastRetry);
    
    @Query("UPDATE offline_queue SET status = :status, error_message = :errorMessage WHERE id = :id")
    void updateErrorStatus(int id, String status, String errorMessage);
}



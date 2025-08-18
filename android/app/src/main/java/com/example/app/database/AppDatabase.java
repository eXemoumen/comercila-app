package com.example.app.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

import com.example.app.database.dao.SaleDao;
import com.example.app.database.dao.OrderDao;
import com.example.app.database.dao.StockDao;
import com.example.app.database.dao.SupermarketDao;
import com.example.app.database.dao.OfflineQueueDao;
import com.example.app.database.entity.Sale;
import com.example.app.database.entity.Order;
import com.example.app.database.entity.Stock;
import com.example.app.database.entity.Supermarket;
import com.example.app.database.entity.OfflineQueueItem;

@Database(
    entities = {
        Sale.class,
        Order.class,
        Stock.class,
        Supermarket.class,
        OfflineQueueItem.class
    },
    version = 1,
    exportSchema = false
)
public abstract class AppDatabase extends RoomDatabase {
    
    private static final String DATABASE_NAME = "topfresh_offline.db";
    private static volatile AppDatabase INSTANCE;
    
    // DAOs
    public abstract SaleDao saleDao();
    public abstract OrderDao orderDao();
    public abstract StockDao stockDao();
    public abstract SupermarketDao supermarketDao();
    public abstract OfflineQueueDao offlineQueueDao();
    
    public static AppDatabase getInstance(Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(
                        context.getApplicationContext(),
                        AppDatabase.class,
                        DATABASE_NAME
                    )
                    .fallbackToDestructiveMigration()
                    .build();
                }
            }
        }
        return INSTANCE;
    }
}

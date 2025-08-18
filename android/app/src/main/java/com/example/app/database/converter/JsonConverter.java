package com.example.app.database.converter;

import androidx.room.TypeConverter;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Map;

public class JsonConverter {
    private static final Gson gson = new Gson();

    @TypeConverter
    public static String fromMap(Map<String, Integer> map) {
        if (map == null) {
            return null;
        }
        return gson.toJson(map);
    }

    @TypeConverter
    public static Map<String, Integer> toMap(String data) {
        if (data == null) {
            return null;
        }
        Type type = new TypeToken<Map<String, Integer>>() {}.getType();
        return gson.fromJson(data, type);
    }

    @TypeConverter
    public static String fromPhoneNumbersList(List<PhoneNumber> phoneNumbers) {
        if (phoneNumbers == null) {
            return null;
        }
        return gson.toJson(phoneNumbers);
    }

    @TypeConverter
    public static List<PhoneNumber> toPhoneNumbersList(String data) {
        if (data == null) {
            return null;
        }
        Type type = new TypeToken<List<PhoneNumber>>() {}.getType();
        return gson.fromJson(data, type);
    }

    // PhoneNumber class for JSON conversion
    public static class PhoneNumber {
        public String name;
        public String number;

        public PhoneNumber() {}

        public PhoneNumber(String name, String number) {
            this.name = name;
            this.number = number;
        }
    }
}

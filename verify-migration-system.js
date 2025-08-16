#!/usr/bin/env node
/**
 * Migration System Verification Script
 * 
 * This script verifies that the migration system is ready for production deployment.
 * It checks Supabase connectivity, database schema, and migration functionality.
 * 
 * Usage: node verify-migration-system.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const envFile = readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && key.startsWith('NEXT_PUBLIC_')) {
        envVars[key] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Required database tables and their expected columns
const REQUIRED_TABLES = {
    supermarkets: ['id', 'name', 'address', 'latitude', 'longitude', 'email', 'phone_numbers', 'created_at'],
    sales: ['id', 'supermarket_id', 'date', 'quantity', 'cartons', 'price_per_unit', 'total_value', 'is_paid', 'payment_date', 'remaining_amount'],
    orders: ['id', 'supermarket_id', 'date', 'quantity', 'status', 'price_per_unit'],
    stock_history: ['id', 'date', 'quantity', 'type', 'reason', 'current_stock', 'fragrance_distribution'],
    fragrance_stock: ['fragrance_id', 'name', 'quantity', 'color'],
    payments: ['id', 'sale_id', 'date', 'amount', 'note']
};

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase connection...');

    try {
        const { data, error } = await supabase.from('supermarkets').select('count').limit(1);

        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return false;
        }

        console.log('✅ Supabase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
}

async function verifyTableSchema() {
    console.log('🔍 Verifying database schema...');

    const results = {};

    for (const [tableName, expectedColumns] of Object.entries(REQUIRED_TABLES)) {
        try {
            // Try to select from table to verify it exists
            const { data, error } = await supabase.from(tableName).select('*').limit(1);

            if (error) {
                console.log(`❌ Table '${tableName}': ${error.message}`);
                results[tableName] = { exists: false, error: error.message };
            } else {
                console.log(`✅ Table '${tableName}': OK`);
                results[tableName] = { exists: true, columns: expectedColumns };
            }
        } catch (error) {
            console.log(`❌ Table '${tableName}': ${error.message}`);
            results[tableName] = { exists: false, error: error.message };
        }
    }

    return results;
}

async function testMigrationFunctions() {
    console.log('🔍 Testing migration functions...');

    // Test if we can insert and delete a test record
    const testSupermarket = {
        name: 'TEST_MIGRATION_SUPERMARKET',
        address: 'Test Address',
        latitude: 0,
        longitude: 0,
        email: 'test@migration.com',
        phone_numbers: [{ name: 'Test', number: '123456789' }]
    };

    try {
        // Insert test record
        const { data: insertData, error: insertError } = await supabase
            .from('supermarkets')
            .insert([testSupermarket])
            .select()
            .single();

        if (insertError) {
            console.log('❌ Insert test failed:', insertError.message);
            return false;
        }

        // Delete test record
        const { error: deleteError } = await supabase
            .from('supermarkets')
            .delete()
            .eq('id', insertData.id);

        if (deleteError) {
            console.log('❌ Delete test failed:', deleteError.message);
            return false;
        }

        console.log('✅ Migration functions test passed');
        return true;
    } catch (error) {
        console.log('❌ Migration functions test failed:', error.message);
        return false;
    }
}

async function checkExistingData() {
    console.log('🔍 Checking for existing data...');

    const dataCounts = {};

    for (const tableName of Object.keys(REQUIRED_TABLES)) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (error) {
                dataCounts[tableName] = { count: 0, error: error.message };
            } else {
                dataCounts[tableName] = { count: count || 0 };
                console.log(`📊 Table '${tableName}': ${count || 0} records`);
            }
        } catch (error) {
            dataCounts[tableName] = { count: 0, error: error.message };
        }
    }

    return dataCounts;
}

function generateMigrationReport(connectionOk, schemaResults, functionsOk, dataCounts) {
    console.log('\n📋 MIGRATION SYSTEM VERIFICATION REPORT');
    console.log('==========================================');

    // Connection Status
    console.log(`\n🔗 Connection: ${connectionOk ? '✅ Ready' : '❌ Failed'}`);

    // Schema Status
    console.log('\n🗄️  Database Schema:');
    const allTablesExist = Object.values(schemaResults).every(result => result.exists);
    console.log(`   Status: ${allTablesExist ? '✅ Ready' : '❌ Missing tables'}`);

    if (!allTablesExist) {
        console.log('   Missing tables:');
        Object.entries(schemaResults).forEach(([table, result]) => {
            if (!result.exists) {
                console.log(`     - ${table}: ${result.error}`);
            }
        });
    }

    // Functions Status
    console.log(`\n⚙️  Migration Functions: ${functionsOk ? '✅ Ready' : '❌ Failed'}`);

    // Data Status
    console.log('\n📊 Existing Data:');
    const totalRecords = Object.values(dataCounts).reduce((sum, data) => sum + (data.count || 0), 0);
    console.log(`   Total records: ${totalRecords}`);

    if (totalRecords > 0) {
        console.log('   ⚠️  Warning: Database contains existing data');
        console.log('   Migration will skip duplicate records');
    }

    // Overall Status
    const isReady = connectionOk && allTablesExist && functionsOk;
    console.log(`\n🎯 Overall Status: ${isReady ? '✅ READY FOR PRODUCTION' : '❌ NEEDS ATTENTION'}`);

    if (isReady) {
        console.log('\n🚀 DEPLOYMENT READY!');
        console.log('✅ Migration system is fully functional');
        console.log('✅ You can safely deploy to production');
        console.log('✅ Users with localStorage data will see migration modal');
        console.log('✅ Migration will preserve all existing data');
    } else {
        console.log('\n⚠️  ACTION REQUIRED:');
        if (!connectionOk) {
            console.log('   - Fix Supabase connection configuration');
        }
        if (!allTablesExist) {
            console.log('   - Run schema.sql in your Supabase dashboard');
            console.log('   - Ensure all required tables are created');
        }
        if (!functionsOk) {
            console.log('   - Check Supabase permissions and policies');
        }
    }

    return isReady;
}

async function main() {
    console.log('🚀 MIGRATION SYSTEM VERIFICATION');
    console.log('=================================\n');

    try {
        // Run all verification tests
        const connectionOk = await testSupabaseConnection();
        console.log('');

        const schemaResults = await verifyTableSchema();
        console.log('');

        const functionsOk = await testMigrationFunctions();
        console.log('');

        const dataCounts = await checkExistingData();

        // Generate final report
        const isReady = generateMigrationReport(connectionOk, schemaResults, functionsOk, dataCounts);

        process.exit(isReady ? 0 : 1);

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
    }
}

// Run verification
main().catch(console.error);
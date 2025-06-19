const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mes_thailand',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 시간 초과
  connectionTimeoutMillis: 2000, // 연결 시간 초과
});

// Supabase 클라이언트 설정
const supabaseUrl = 'https://rrkumbyeyhxdsblqxrmn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJya3VtYnlleWh4ZHNibHF4cm1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDA2Nzg1MiwiZXhwIjoyMDY1NjQzODUyfQ.E4xvPIAHF_OOlgI4vgU4BdtYSKcaSTBz55QfbI5nYNs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 데이터베이스 연결 테스트
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL database error:', err);
  process.exit(-1);
});

// 쿼리 헬퍼 함수
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('query error', { text, error });
    throw error;
  }
};

// 트랜잭션 헬퍼 함수
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // 트랜잭션 시작
  const begin = async () => {
    await client.query('BEGIN');
  };
  
  // 트랜잭션 커밋
  const commit = async () => {
    await client.query('COMMIT');
  };
  
  // 트랜잭션 롤백
  const rollback = async () => {
    await client.query('ROLLBACK');
  };
  
  // 리소스 해제 (트랜잭션 종료 시 반드시 호출)
  const done = (error) => {
    if (error) {
      console.error('Transaction error:', error);
    }
    client.release();
  };
  
  return {
    query: query.bind(client),
    begin,
    commit,
    rollback,
    done
  };
};

module.exports = {
  pool,
  query,
  getClient,
  supabase
}; 
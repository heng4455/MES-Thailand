const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nnqinxlpzjgqjhvqzgqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucWlueGxwempncWpodnF6Z3FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQxMzA3MSwiZXhwIjoyMDUxOTg5MDcxfQ.7bPsL5ZhKZ4SnJoFbIIhqQu5qeRXKNFZxKEfLPGqNqU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixSequences() {
    console.log('🔍 시퀀스 상태 확인 중...');
    
    try {
        // 1. user_profiles 테이블 구조 확인
        const { data: columns, error: colError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, column_default, is_nullable')
            .eq('table_schema', 'public')
            .eq('table_name', 'user_profiles')
            .order('ordinal_position');

        if (colError) {
            console.log('❌ 컬럼 정보 조회 실패:', colError.message);
        } else {
            console.log('📋 user_profiles 테이블 구조:', columns);
        }

        // 2. 시퀀스 생성 및 수정
        console.log('\n🔧 시퀀스 수정 시작...');
        
        // 각 SQL 명령을 개별적으로 실행
        const commands = [
            {
                sql: "DROP SEQUENCE IF EXISTS user_profiles_id_seq CASCADE;",
                desc: "기존 시퀀스 삭제"
            },
            {
                sql: "CREATE SEQUENCE user_profiles_id_seq;",
                desc: "새 시퀀스 생성"
            },
            {
                sql: "SELECT setval('user_profiles_id_seq', COALESCE((SELECT MAX(id) FROM user_profiles), 1));",
                desc: "시퀀스 시작값 설정"
            },
            {
                sql: "ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT nextval('user_profiles_id_seq');",
                desc: "기본값 설정"
            },
            {
                sql: "ALTER SEQUENCE user_profiles_id_seq OWNED BY user_profiles.id;",
                desc: "시퀀스 소유권 설정"
            }
        ];
        
        for (const cmd of commands) {
            try {
                const { data, error } = await supabase.rpc('exec_sql', { sql: cmd.sql });
                if (error) {
                    console.log('❌', cmd.desc, ':', error.message);
                } else {
                    console.log('✅', cmd.desc);
                }
            } catch (err) {
                console.log('❌', cmd.desc, ':', err.message);
            }
        }

        // 3. 수정 후 테스트
        console.log('\n🔍 수정 후 테스트...');
        
        const { data: testData, error: testError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
            
        if (testError) {
            console.log('❌ user_profiles 테이블 접근 테스트 실패:', testError.message);
        } else {
            console.log('✅ user_profiles 테이블 접근 성공');
        }

        // 4. 시퀀스 상태 확인
        const { data: seqCheck, error: seqError } = await supabase.rpc('exec_sql', {
            sql: "SELECT last_value FROM user_profiles_id_seq;"
        });
        
        if (seqError) {
            console.log('❌ 시퀀스 확인 실패:', seqError.message);
        } else {
            console.log('✅ 시퀀스 현재값:', seqCheck);
        }

    } catch (error) {
        console.error('❌ 전체 프로세스 실패:', error);
    }
}

checkAndFixSequences(); 
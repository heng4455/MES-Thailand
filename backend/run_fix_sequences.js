const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nnqinxlpzjgqjhvqzgqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucWlueGxwempncWpodnF6Z3FqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjQxMzA3MSwiZXhwIjoyMDUxOTg5MDcxfQ.7bPsL5ZhKZ4SnJoFbIIhqQu5qeRXKNFZxKEfLPGqNqU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFixSequences() {
    console.log('🔧 시퀀스 수정 시작...');
    
    const commands = [
        'DROP SEQUENCE IF EXISTS user_profiles_id_seq CASCADE',
        'CREATE SEQUENCE user_profiles_id_seq',
        'ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT nextval(\'user_profiles_id_seq\')',
        'ALTER SEQUENCE user_profiles_id_seq OWNED BY user_profiles.id'
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        try {
            console.log(`[${i + 1}/${commands.length}] ${command}`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql: command + ';'
            });
            
            if (error) {
                console.log('❌ 오류:', error.message);
                errorCount++;
            } else {
                console.log('✅ 성공');
                successCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (err) {
            console.log('❌ 예외:', err.message);
            errorCount++;
        }
    }
    
    console.log(`📊 실행 완료: 성공 ${successCount}개, 실패 ${errorCount}개`);
    
    try {
        const { data: testData, error: testError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
            
        if (testError) {
            console.log('❌ user_profiles 테이블 접근 실패:', testError.message);
        } else {
            console.log('✅ user_profiles 테이블 접근 성공');
        }
    } catch (err) {
        console.log('❌ 테스트 실패:', err.message);
    }
}

runFixSequences(); 
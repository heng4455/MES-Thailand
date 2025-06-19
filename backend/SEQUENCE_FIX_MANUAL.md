# 시퀀스 수정 수동 실행 가이드

## 문제 상황
`ERROR: 42P01: relation "user_profiles_id_seq" does not exist` 오류가 발생하고 있습니다.

## 해결 방법
Supabase 대시보드 → SQL Editor에서 다음 명령들을 순서대로 실행해주세요:

### 1단계: 기존 시퀀스 삭제 (있다면)
```sql
DROP SEQUENCE IF EXISTS user_profiles_id_seq CASCADE;
```

### 2단계: 새 시퀀스 생성
```sql
CREATE SEQUENCE user_profiles_id_seq;
```

### 3단계: 시퀀스 시작값 설정
```sql
SELECT setval('user_profiles_id_seq', COALESCE((SELECT MAX(id) FROM user_profiles), 1));
```

### 4단계: 테이블 기본값 설정
```sql
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT nextval('user_profiles_id_seq');
```

### 5단계: 시퀀스 소유권 설정
```sql
ALTER SEQUENCE user_profiles_id_seq OWNED BY user_profiles.id;
```

### 6단계: 확인
```sql
-- 시퀀스 상태 확인
SELECT last_value FROM user_profiles_id_seq;

-- 테이블 구조 확인
\d user_profiles
```

### 다른 테이블들도 같은 방식으로 수정
필요시 다음 테이블들도 같은 방식으로 시퀀스를 생성해주세요:

```sql
-- products 테이블
DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
CREATE SEQUENCE products_id_seq;
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
ALTER TABLE products ALTER COLUMN id SET DEFAULT nextval('products_id_seq');
ALTER SEQUENCE products_id_seq OWNED BY products.id;

-- customers 테이블
DROP SEQUENCE IF EXISTS customers_id_seq CASCADE;
CREATE SEQUENCE customers_id_seq;
SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1));
ALTER TABLE customers ALTER COLUMN id SET DEFAULT nextval('customers_id_seq');
ALTER SEQUENCE customers_id_seq OWNED BY customers.id;

-- work_orders 테이블
DROP SEQUENCE IF EXISTS work_orders_id_seq CASCADE;
CREATE SEQUENCE work_orders_id_seq;
SELECT setval('work_orders_id_seq', COALESCE((SELECT MAX(id) FROM work_orders), 1));
ALTER TABLE work_orders ALTER COLUMN id SET DEFAULT nextval('work_orders_id_seq');
ALTER SEQUENCE work_orders_id_seq OWNED BY work_orders.id;
```

## 실행 후 확인
모든 시퀀스가 정상적으로 생성되었는지 확인:

```sql
SELECT 
    schemaname, 
    sequencename, 
    last_value,
    increment_by
FROM pg_sequences 
WHERE schemaname = 'public'
ORDER BY sequencename;
```

## 참고사항
- 각 명령을 하나씩 실행하고 오류가 없는지 확인하세요
- 시퀀스가 생성된 후에는 새로운 레코드 삽입 시 자동으로 ID가 할당됩니다
- 기존 데이터는 영향을 받지 않습니다 
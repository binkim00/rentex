-- 데이터 초기화
DELETE FROM item;
DELETE FROM user;
DELETE FROM partner;
DELETE FROM category;

-- 카테고리
INSERT INTO category (id, name) VALUES
                                    (1, '카메라'),
                                    (2, '드론'),
                                    (3, '삼각대');

-- 파트너
INSERT INTO partner (id, name, business_no, contact_email, contact_phone, created_at)
VALUES
    (1, '렌텍스테크', '123-45-67890', 'tech@rentex.com', '02-1234-5678', NOW()),
    (2, '에이치렌탈', '987-65-43210', 'hrental@rentex.com', '031-9876-5432', NOW());

-- 유저
INSERT INTO user (id, email, password, name, nickname, role, created_at, updated_at)
VALUES
    (1, 'user1@rentex.com', '$2a$10$Dow1dZegFfNyQ2Q8qYMK8u9B9m8cPQgE1zLOKMGdCjHh5QiNvxtlW', '홍길동', '길동이', 'USER', NOW(), NOW()),
    (2, 'partner1@rentex.com', '$2a$10$Dow1dZegFfNyQ2Q8qYMK8u9B9m8cPQgE1zLOKMGdCjHh5QiNvxtlW', '박파트너', '렌탈왕', 'PARTNER', NOW(), NOW()),
    (3, 'admin@rentex.com', '$2a$10$Dow1dZegFfNyQ2Q8qYMK8u9B9m8cPQgE1zLOKMGdCjHh5QiNvxtlW', '관리자', '운영자', 'ADMIN', NOW(), NOW());

-- 수정된 Item insert 구문 (status 포함)
INSERT INTO item (id, name, description, stock_quantity, status, partner_id, created_at, updated_at)
VALUES
    (1, 'DSLR 카메라', '고화질 카메라입니다.', 10, 'AVAILABLE', 1, NOW(), NOW()),
    (2, '4K 드론', '촬영용 드론입니다.', 5, 'AVAILABLE', 1, NOW(), NOW()),
    (3, '삼각대', '튼튼한 삼각대입니다.', 20, 'UNAVAILABLE', 2, NOW(), NOW());
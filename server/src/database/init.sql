CREATE TYPE role_type           AS ENUM ('STUDENT', 'ASSISTANT', 'ADMIN');
CREATE TYPE condition_type      AS ENUM ('GOOD', 'POOR');
CREATE TYPE post_status_type    AS ENUM ('AVAILABLE', 'SOLD');
CREATE TYPE request_status_type AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');
CREATE TYPE document_type       AS ENUM ('EXAM', 'SLIDE', 'TEXTBOOK');
CREATE TYPE document_status_type AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE report_status_type  AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');


CREATE TABLE units (
    id   SERIAL       PRIMARY KEY,
    code VARCHAR(25)  UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE subjects (
    id      SERIAL       PRIMARY KEY,
    code    VARCHAR(25)  UNIQUE NOT NULL,
    name    VARCHAR(255) NOT NULL,

    unit_id INT          NOT NULL REFERENCES units(id) ON DELETE CASCADE -- Khoa bị xóa -> Môn học bị xóa
);

CREATE TABLE users (
    id         SERIAL       PRIMARY KEY,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    password   TEXT,
    email      VARCHAR(125) UNIQUE,
    avatar_url TEXT,
    google_id  VARCHAR(255) UNIQUE,
    full_name  VARCHAR(255) NOT NULL,
    phone      VARCHAR(15)  UNIQUE,
    role       role_type    NOT NULL DEFAULT 'STUDENT',

    unit_id    INT          REFERENCES units(id) ON DELETE CASCADE, -- Khoa bị xóa -> Trợ lý Khoa bị xóa
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    /*
    - Trợ lý Khoa phải thuộc 1 Khoa
    - Sinh viên và Quản trị không thuộc Khoa nào
    */
    CONSTRAINT check_user_unit CHECK (
        (role = 'STUDENT' AND unit_id IS NULL) OR 
        (role = 'ADMIN' AND unit_id IS NULL) OR 
        (role = 'ASSISTANT' AND unit_id IS NOT NULL)
    )
);

CREATE TABLE posts (
    id          SERIAL         PRIMARY KEY,
    title       VARCHAR(255)   NOT NULL,
    description TEXT,
    price       INT            NOT NULL DEFAULT 0,
    condition   condition_type NOT NULL DEFAULT 'GOOD',
    image_url   TEXT           NOT NULL,
    place       VARCHAR(100)   NOT NULL,
    status      post_status_type NOT NULL DEFAULT 'AVAILABLE',
    is_hidden   BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    subject_id  INT            REFERENCES subjects(id) ON DELETE SET NULL, -- Môn học bị xóa -> Bài đăng thành tự do (để thống kê)
    user_id     INT            NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Người đăng bị xóa -> Bài đăng bị xóa

    /*
    - Giá phải >= 0
    */
    CONSTRAINT check_price CHECK (price >= 0)

);

CREATE TABLE exchange_requests (
    id             SERIAL         PRIMARY KEY,

    buyer_message  TEXT,
    meeting_at     TIMESTAMP,
    poster_message TEXT,
    status         request_status_type NOT NULL DEFAULT 'PENDING',
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    post_id        INT            NOT NULL REFERENCES posts(id) ON DELETE CASCADE, -- Bài đăng bị xóa -> Yêu cầu bị xóa
    buyer_id       INT            NOT NULL REFERENCES users(id) ON DELETE CASCADE -- Người mua bị xóa -> Yêu cầu bị xóa
);

CREATE TABLE documents (
    id         SERIAL       PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    file_url   TEXT         NOT NULL,
    type       document_type NOT NULL,
    status     document_status_type NOT NULL DEFAULT 'PENDING',
    is_hidden  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    subject_id INT          REFERENCES subjects(id) ON DELETE SET NULL, -- Môn học bị xóa -> Tài liệu thành tự do (để thống kê)
    user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE -- Người đăng bị xóa -> Tài liệu bị xóa
);

CREATE TABLE reports (
    id            SERIAL        PRIMARY KEY,
    reason        VARCHAR(100),
    description   TEXT,
    status        report_status_type NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    post_id       INT           REFERENCES posts(id) ON DELETE CASCADE, -- Bài đăng bị xóa -> Xóa Báo cáo
    document_id   INT           REFERENCES documents(id) ON DELETE CASCADE, -- Tài liệu bị xóa -> Xóa Báo cáo
    reporter_id   INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Người báo cáo bị xóa -> Báo cáo bị xóa

    /*
    - 1 báo cáo chỉ của 1 bài đăng
    - Hoặc 1 báo cáo chỉ của 1 tài liệu
    */
    CONSTRAINT check_report_target CHECK (
        (post_id IS NOT NULL AND document_id IS NULL) OR 
        (post_id IS NULL AND document_id IS NOT NULL)
    )
    
);


CREATE INDEX idx_posts_user    ON posts(user_id);
CREATE INDEX idx_posts_status  ON posts(status);
CREATE INDEX idx_posts_subject ON posts(subject_id);
CREATE INDEX idx_req_post      ON exchange_requests(post_id);
CREATE INDEX idx_req_buyer     ON exchange_requests(buyer_id);
CREATE INDEX idx_docs_subject  ON documents(subject_id);
CREATE INDEX idx_docs_status   ON documents(status);
CREATE INDEX idx_reports_post  ON reports(post_id);
CREATE INDEX idx_reports_doc   ON reports(document_id);

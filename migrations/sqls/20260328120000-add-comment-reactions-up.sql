CREATE TABLE IF NOT EXISTS comment_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (comment_id, user_id)   -- 👈 one reaction per user per comment
);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (post_slug, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_slug ON post_reactions(post_slug);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
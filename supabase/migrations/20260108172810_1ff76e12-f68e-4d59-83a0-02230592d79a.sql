-- Adicionar coluna de tags à tabela news
ALTER TABLE public.news 
ADD COLUMN tags text[] DEFAULT '{}'::text[];

-- Adicionar índice GIN para busca eficiente por tags
CREATE INDEX idx_news_tags ON public.news USING GIN(tags);
import { useState, useEffect } from 'react';

const FREE_ARTICLES_KEY = 'free_articles_read';
const MAX_FREE_ARTICLES = 1;

export const useFreeArticle = () => {
  const [freeArticlesUsed, setFreeArticlesUsed] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(FREE_ARTICLES_KEY);
    setFreeArticlesUsed(stored ? parseInt(stored, 10) : 0);
  }, []);

  const markArticleAsRead = () => {
    const newCount = freeArticlesUsed + 1;
    setFreeArticlesUsed(newCount);
    localStorage.setItem(FREE_ARTICLES_KEY, newCount.toString());
  };

  const canReadFreeArticle = () => {
    return freeArticlesUsed < MAX_FREE_ARTICLES;
  };

  const resetFreeArticles = () => {
    setFreeArticlesUsed(0);
    localStorage.removeItem(FREE_ARTICLES_KEY);
  };

  return {
    freeArticlesUsed,
    canReadFreeArticle,
    markArticleAsRead,
    resetFreeArticles,
    maxFreeArticles: MAX_FREE_ARTICLES
  };
};
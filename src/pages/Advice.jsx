import { useEffect, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Link, useParams } from 'react-router';
import { api } from '../lib/api';
import { useStore } from '../state/StoreContext';

export function AdviceDirectory() {
  const { articles } = useStore();
  return <main className="inner-page"><nav className="breadcrumbs"><Link to="/">Accueil</Link> / Conseils</nav><div className="page-heading"><p className="eyebrow">La Gallery vous accompagne</p><h1>Conseils</h1><p>Des réponses simples pour composer votre routine.</p></div>
    {articles.length ? <div className="directory-grid">{articles.map((article) => <Link className="directory-card" key={article.slug} to={`/conseils/${article.slug}`}><span>{article.title}</span><small>{article.excerpt}</small><ArrowRight size={18} /></Link>)}</div>
      : <div className="state-panel"><h2>Nos conseils arrivent bientôt</h2><p>Commencez par explorer les routines simples de la Gallery.</p><Link to="/routines" className="button-primary">Voir les routines</Link></div>}
  </main>;
}

export function AdviceArticle() {
  const { slug } = useParams();
  const { adviceArticles } = useStore();
  const [article, setArticle] = useState(adviceArticles.find((item) => item.slug === slug) || null);
  useEffect(() => {
    const cached = adviceArticles.find((item) => item.slug === slug);
    if (cached) { setArticle(cached); return; }
    let alive = true;
    api(`/articles/${slug}`).then((item) => alive && setArticle(item)).catch(() => alive && setArticle(null));
    return () => { alive = false; };
  }, [slug, adviceArticles]);
  if (!article) return <main className="inner-page"><div className="state-panel"><h1>Conseil introuvable</h1><Link className="button-primary" to="/conseils">Voir les conseils</Link></div></main>;
  return <main className="inner-page advice-article"><nav className="breadcrumbs"><Link to="/">Accueil</Link> / <Link to="/conseils">Conseils</Link> / {article.title}</nav><div className="page-heading"><p className="eyebrow">Conseils de la Gallery</p><h1>{article.title}</h1><p>{article.excerpt}</p></div><div className="article-body">{article.body.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></main>;
}

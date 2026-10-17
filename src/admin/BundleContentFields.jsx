const FIELDS = [
  ['name', 'Titre affiché'], ['summary', 'Résumé'], ['who', 'Pour qui'],
  ['why', 'Pourquoi ces produits ensemble'], ['expect', 'Résultat réaliste'],
  ['benefits', 'Bénéfices, une ligne par point'], ['skin_types', 'Types de peau, une ligne par type'],
  ['not_for', 'À savoir avant de commencer, une ligne par point'],
  ['morning', 'Le matin, une ligne par étape'], ['evening', 'Le soir, une ligne par étape'],
  ['weekly', 'Dans la semaine, une ligne par étape'], ['caution', 'Précautions, une ligne par point'],
];
const LISTS = new Set(['benefits', 'skin_types', 'not_for', 'morning', 'evening', 'weekly', 'caution']);

export default function BundleContentFields({ content = {}, items = [], products = [], onChange }) {
  function update(lang, key, raw) {
    const value = LISTS.has(key) ? raw.split('\n').map((part) => part.trim()).filter(Boolean) : raw;
    onChange({ ...content, [lang]: { ...content[lang], [key]: value } });
  }
  function updateNote(lang, productId, value) {
    onChange({ ...content, [lang]: { ...content[lang], component_notes: { ...content[lang]?.component_notes, [productId]: value } } });
  }
  return <div className="admin-bundle-copy">
    <h3>Guide du pack</h3><p className="quiet-note">Les détails s’affichent sur la page du pack. La darija s’écrit en lettres arabes. Une ligne correspond à une étape ou un point de liste.</p>
    {[['fr', 'Français'], ['ar', 'الدارجة']].map(([lang, label]) => <details key={lang} className="admin-bundle-copy-language"><summary>{label}</summary>
      <div className="admin-bundle-copy-fields" dir={lang === 'ar' ? 'rtl' : undefined}>
        {FIELDS.map(([key, title]) => <label key={key}>{title}<textarea rows={LISTS.has(key) ? 3 : 2} value={Array.isArray(content[lang]?.[key]) ? content[lang][key].join('\n') : content[lang]?.[key] || ''} onChange={(event) => update(lang, key, event.target.value)} /></label>)}
        <h4>Rôle de chaque produit</h4>
        {items.filter((item) => item.product_id).map((item) => { const product = products.find((row) => row.id === Number(item.product_id)); return <label key={item.product_id}>{product?.name || `Produit ${item.product_id}`}<textarea rows={2} value={content[lang]?.component_notes?.[String(item.product_id)] || ''} onChange={(event) => updateNote(lang, String(item.product_id), event.target.value)} /></label>; })}
      </div>
    </details>)}
  </div>;
}

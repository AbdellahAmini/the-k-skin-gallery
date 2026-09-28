import { Link } from 'react-router';
import { useStore } from '../state/StoreContext';

const content = {
  faq: ['Questions fréquentes', [
    ['Comment payer ?', 'Le règlement se fait à la livraison. Aucune carte bancaire n’est demandée sur le site.'],
    ['Comment connaître les frais de livraison ?', 'Choisissez votre ville sur la page de commande pour voir le tarif exact avant de commander.'],
    ['Quand la commande est-elle confirmée ?', 'Après l’enregistrement, notre équipe vous appelle pour confirmer les informations avant préparation.'],
  ]],
  livraison: ['Livraison', [
    ['Où livrez-vous ?', 'Les villes proposées dans le formulaire de commande sont actuellement desservies.'],
    ['Tarifs', 'Le tarif dépend de la ville. Le total, livraison comprise, apparaît avant la validation de la commande.'],
    ['Délais', 'Les délais indicatifs peuvent varier selon la ville et le transporteur.'],
  ]],
  retours: ['Retours', [
    ['Besoin d’aide après la livraison ?', 'Contactez la Gallery en précisant votre numéro de commande et le problème rencontré.'],
    ['Produit reçu endommagé ?', 'Conservez le produit et son emballage puis contactez rapidement notre équipe avec des photos.'],
  ]],
  cgv: ['Conditions de vente', [['Commande', 'Une commande déposée est enregistrée avec le statut « À confirmer ». Elle est vérifiée avec vous par téléphone avant préparation.'], ['Paiement et livraison', 'Le paiement se fait à la livraison. Le prix des produits et les frais de livraison sont indiqués avant validation.']]],
  confidentialite: ['Confidentialité', [['Données de commande', 'Les coordonnées saisies sont utilisées pour traiter et livrer votre commande.'], ['Compte', 'Les informations de votre compte servent à retrouver vos commandes et favoris.']]],
};

export default function Info({ type }) {
  const { settings, content: sections } = useStore();
  if (type === 'contact') return <main className="inner-page"><div className="page-heading"><p className="eyebrow">À votre écoute</p><h1>Contact</h1><p>Une question sur un produit, une commande ou la livraison ?</p></div>
    <div className="info-grid"><section><h2>Assistant skincare</h2><p>Notre équipe peut vous aider à trouver un soin parmi les produits de la Gallery.</p>
      {settings.whatsapp_number ? <a className="button-primary" href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Écrire sur WhatsApp</a> : <p className="quiet-note">Le numéro WhatsApp sera affiché lorsqu’il aura été configuré.</p>}</section>
      <section><h2>Par téléphone</h2>{settings.support_phone ? <a href={`tel:${settings.support_phone}`}>{settings.support_phone}</a> : <p className="quiet-note">Numéro à renseigner dans les paramètres de la Gallery.</p>}</section></div></main>;
  const [title, fallbackBlocks] = content[type] || content.faq;
  const blocks = type === 'faq' && sections.faq?.items?.length
    ? sections.faq.items.map((item) => [item.question, item.answer]) : fallbackBlocks;
  return <main className="inner-page"><div className="page-heading"><p className="eyebrow">Aide</p><h1>{title}</h1></div><div className="info-grid">{blocks.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}</div><p className="info-contact">Vous avez une autre question ? <Link to="/contact" className="rose-link">Contactez-nous</Link>.</p></main>;
}

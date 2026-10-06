import { BRAND_NAME, SUPPORT_EMAIL } from "@shared/brand";
import type { TranslationKey } from "./en";

/** Français (Québec). Le type garantit que chaque clé de en.ts existe ici. */
export const fr: Record<TranslationKey, string> = {
  "nav.submit": "Soumettre une réclamation",
  "nav.track": "Suivre ma réclamation",
  "nav.calculator": "Calculateur",
  "nav.faq": "FAQ",
  "nav.register": "S'inscrire",
  "nav.login": "Connexion",
  "nav.logout": "Déconnexion",
  "nav.myClaims": "Mes réclamations",
  "nav.admin": "Admin",
  "nav.language": "EN",
  "nav.languageTitle": "Switch to English",
  "nav.theme": "Changer le thème",

  "hero.title": "Obtenez votre indemnisation de vol",
  "hero.subtitle": "15 % de frais, aucun gain, aucun frais",
  "hero.lead": "Vol retardé, annulé ou embarquement refusé sur un vol à destination, en provenance ou à l'intérieur du Canada? Réclamez jusqu'à 2 400 $ CA. Nous ne facturons notre commission de 15 % que si vous gagnez.",
  "hero.commissionTitle": "Structure de commission transparente",
  "hero.compensation": "Indemnisation",
  "hero.ourFee": "Nos frais (15 %)",
  "hero.youReceive": "Vous recevez",
  "hero.ifNoWin": "Si aucun gain",
  "hero.noFee": "0 $ de frais",
  "hero.submit": "Soumettre une réclamation",
  "hero.calculate": "Calculer",
  "hero.welcome": "Bon retour, {name}!",
  "hero.newUser": "Nouveau? Inscrivez-vous ici",
  "hero.haveAccount": "Déjà un compte? Connexion",
  "hero.quickTitle": "Processus de réclamation rapide",
  "hero.quickLead": "Soumettez votre réclamation en moins de 5 minutes. Nous vérifions instantanément votre admissibilité selon les règles du RPPA.",
  "hero.quick1": "Détails du vol et documents",
  "hero.quick2": "Vérification d'admissibilité RPPA instantanée",
  "hero.quick3": "Commission uniquement en cas de succès",

  "trust.maxAmount": "Jusqu'à 2 400 $",
  "trust.maxLabel": "Indemnisation RPPA par passager",
  "trust.commission": "15 %",
  "trust.commissionLabel": "Notre commission, seulement si vous gagnez",
  "trust.noWin": "0 $",
  "trust.noWinLabel": "Si la réclamation échoue",

  "calc.title": "Calculateur de commission",
  "calc.lead": "Voyez exactement ce que vous recevrez après notre commission de 15 %. Les montants suivent le RPPA canadien : ils dépendent de ce qui s'est passé, de la taille du transporteur et de votre retard à l'arrivée.",
  "calc.heading": "Calculez votre indemnisation",
  "calc.issue": "Que s'est-il passé? *",
  "calc.issuePlaceholder": "Choisissez la situation",
  "calc.airline": "Compagnie aérienne *",
  "calc.airlinePlaceholder": "Choisissez votre compagnie",
  "calc.largeGroup": "Grands transporteurs (400 $ – 1 000 $)",
  "calc.smallGroup": "Petits transporteurs (125 $ – 500 $)",
  "calc.otherLarge": "Autre grand transporteur",
  "calc.otherSmall": "Autre petit transporteur",
  "calc.delay": "Retard à l'arrivée *",
  "calc.delayPlaceholder": "Choisissez la durée du retard",
  "calc.reason": "Raison donnée par la compagnie *",
  "calc.reasonPlaceholder": "Choisissez la raison",
  "calc.vouchers": "Bons de repas reçus",
  "calc.vouchersPlaceholder": "p. ex. 15 $ ou laissez vide",
  "calc.vouchersHelp": "Si vous avez reçu des bons de repas, indiquez le montant en dollars canadiens. Sinon, laissez vide.",
  "calc.button": "Calculer l'indemnisation",
  "calc.calculating": "Calcul en cours...",
  "calc.resultTitle": "Détail de votre indemnisation",
  "calc.appr": "Indemnisation RPPA ({carrier})",
  "calc.deniedBoarding": "Indemnisation pour refus d'embarquement",
  "calc.voucherDeduct": "Bons de repas déjà reçus",
  "calc.total": "Indemnisation totale",
  "calc.commission": "Notre commission (15 %)",
  "calc.youReceive": "Vous recevez",
  "calc.reviewNote": "Nous confirmerons la cause de la perturbation auprès de la compagnie avant tout paiement.",
  "calc.submitNow": "Soumettre ma réclamation",
  "calc.stillSubmit": "Pas certain que la compagnie ait raison? Vous pouvez quand même soumettre; notre équipe vérifiera la vraie cause.",
  "calc.carrierLarge": "grand transporteur",
  "calc.carrierSmall": "petit transporteur",

  "issue.delayed": "Vol retardé",
  "issue.cancelled": "Vol annulé",
  "issue.denied-boarding": "Embarquement refusé (surréservation)",
  "issue.missed-connection": "Correspondance manquée",
  "band.0-3": "Moins de 3 heures",
  "band.3-6": "3 à 6 heures",
  "band.6-9": "6 à 9 heures",
  "band.9+": "9 heures et plus",
  "reason.maintenance_non_safety": "Problèmes d'entretien (non liés à la sécurité)",
  "reason.crew_scheduling": "Problèmes d'horaire de l'équipage",
  "reason.overbooking": "Surréservation ou problèmes d'embarquement",
  "reason.operational_decisions": "Décisions opérationnelles",
  "reason.it_failure": "Pannes informatiques",
  "reason.ground_handling": "Retards de manutention au sol",
  "reason.fueling_deicing": "Retards de ravitaillement ou de dégivrage (hors météo)",
  "reason.weather": "Conditions météorologiques",
  "reason.atc": "Restrictions du contrôle aérien (ATC)",
  "reason.security": "Incidents de sécurité",
  "reason.airport_failure": "Problèmes d'exploitation de l'aéroport",
  "reason.safety_maintenance": "Entretien lié à la sécurité",
  "reason.third_party_strikes": "Grèves de tiers",
  "reason.government_delays": "Retards gouvernementaux ou réglementaires",
  "reason.medical_emergencies": "Urgences médicales",
  "reason.cyberattacks": "Cyberattaques",
  "reason.unknown": "Je ne sais pas / la compagnie ne l'a pas dit",
  "reasonDesc.maintenance_non_safety": "Problèmes d'entretien courants qui n'affectent pas la sécurité du vol, comme la réparation d'équipement de cabine.",
  "reasonDesc.crew_scheduling": "Problèmes d'horaire de l'équipage, dont correspondances manquées, temps de repos insuffisant ou manque de personnel.",
  "reasonDesc.overbooking": "Vol surréservé par la compagnie ou passager refusé à l'embarquement faute de places.",
  "reasonDesc.operational_decisions": "Décisions d'affaires de la compagnie comme un changement de route, d'appareil ou d'horaire.",
  "reasonDesc.it_failure": "Pannes de systèmes informatiques, de réservation ou problèmes techniques d'exploitation.",
  "reasonDesc.ground_handling": "Retards de chargement des bagages, de ravitaillement ou d'autres opérations au sol non liés à la météo.",
  "reasonDesc.fueling_deicing": "Retards de ravitaillement ou de dégivrage non causés par les conditions météo.",
  "reasonDesc.weather": "Conditions météorologiques sévères rendant le vol dangereux : tempêtes, brouillard, vents violents.",
  "reasonDesc.atc": "Restrictions du contrôle aérien, congestion de l'aéroport ou fermeture de l'espace aérien par les autorités.",
  "reasonDesc.security": "Incidents de sécurité, alertes à la bombe ou contrôles de sécurité renforcés.",
  "reasonDesc.airport_failure": "Problèmes d'infrastructure aéroportuaire, pannes de courant ou d'équipement à l'aéroport.",
  "reasonDesc.safety_maintenance": "Entretien obligatoire lié à la sécurité découvert lors des vérifications avant vol.",
  "reasonDesc.third_party_strikes": "Grèves des contrôleurs aériens, du personnel de l'aéroport ou d'autres fournisseurs tiers.",
  "reasonDesc.government_delays": "Restrictions gouvernementales, problèmes de contrôle frontalier ou retards réglementaires.",
  "reasonDesc.medical_emergencies": "Urgences médicales nécessitant un déroutement ou le débarquement d'un passager.",
  "reasonDesc.cyberattacks": "Incidents de cybersécurité touchant l'exploitation de la compagnie ou les systèmes de l'aéroport.",
  "reasonDesc.unknown": "Les compagnies doivent vous dire la raison. Si elles ne l'ont pas fait, nous la leur demandons et la vérifions.",

  "claim.title": "Soumettez votre réclamation",
  "claim.lead": "Un processus simple en 3 étapes. Nous vérifions votre admissibilité selon le RPPA et nous occupons de tout pour seulement 15 %.",
  "claim.received": "Réclamation reçue",
  "claim.saveId": "Conservez votre numéro de réclamation. Il sert à suivre votre dossier et figure dans chacun de nos courriels.",
  "claim.estimate": "Indemnisation RPPA estimée : {amount} $ CA (nos 15 % ne sont facturés que si vous gagnez).",
  "claim.reviewPending": "La cause de votre perturbation sera vérifiée auprès de la compagnie avant que nous confirmions le montant.",
  "claim.track": "Suivre cette réclamation",
  "claim.another": "Soumettre une autre réclamation",
  "claim.step": "Étape {n} de 3",
  "claim.step1": "Détails du vol",
  "claim.step2": "Documents justificatifs",
  "claim.step3": "Entente et soumission",
  "claim.flightNumber": "Numéro de vol *",
  "claim.flightNumberPlaceholder": "p. ex. AC 123",
  "claim.flightDate": "Date du vol *",
  "claim.departure": "Aéroport de départ *",
  "claim.departurePlaceholder": "p. ex. Montréal (YUL)",
  "claim.arrival": "Aéroport d'arrivée *",
  "claim.arrivalPlaceholder": "p. ex. Vancouver (YVR)",
  "claim.passengerInfo": "Renseignements sur le passager",
  "claim.fullName": "Nom complet *",
  "claim.fullNamePlaceholder": "Tel qu'indiqué sur la carte d'embarquement",
  "claim.email": "Adresse courriel *",
  "claim.emailPlaceholder": "votre@courriel.com",
  "claim.prefilled": "Rempli à partir de votre compte. Modifiez-le si le passager est quelqu'un d'autre.",
  "claim.details": "Ce qui s'est passé",
  "claim.whatHappened": "Que s'est-il passé? *",
  "claim.selectIssue": "Choisissez la situation",
  "claim.delayDuration": "Avec quel retard êtes-vous arrivé? *",
  "claim.selectDelay": "Choisissez la durée du retard",
  "claim.delayReason": "Raison donnée par la compagnie *",
  "claim.selectReason": "Choisissez la raison",
  "claim.reasonHelp": "Pas certain? Choisissez « Je ne sais pas ». Nous obtiendrons la raison auprès de la compagnie.",
  "claim.vouchers": "Bons de repas reçus",
  "claim.vouchersPlaceholder": "p. ex. 15 $ ou laissez vide",
  "claim.vouchersHelp": "Si vous avez reçu des bons de repas, indiquez le montant en dollars canadiens. Sinon, laissez vide.",
  "claim.docs": "Documents justificatifs",
  "claim.uploadLead": "Téléversez votre carte d'embarquement et tout document pertinent",
  "claim.uploadHelp": "Fichiers PDF, PNG ou JPG jusqu'à 10 Mo chacun, maximum 5 fichiers",
  "claim.chooseFiles": "Choisir des fichiers",
  "claim.uploadedFiles": "Fichiers téléversés",
  "claim.remove": "Retirer",
  "claim.consentsTitle": "Consentements requis et entente de commission",
  "claim.feeTitle": "Notre structure de frais transparente :",
  "claim.fee1": "Commission de 15 % facturée uniquement si la réclamation réussit",
  "claim.fee2": "Aucuns frais initiaux ni frais cachés",
  "claim.fee3": "Accompagnement complet tout au long du processus",
  "claim.fee4": "Négociation experte avec les compagnies aériennes",
  "claim.commissionAgree": "J'accepte la structure de commission de 15 % *",
  "claim.commissionAgreeHelp": "Ces frais couvrent notre service et sont déduits de votre indemnisation avant le virement.",
  "claim.previous": "Précédent",
  "claim.next": "Suivant",
  "claim.submit": "Soumettre la réclamation",
  "claim.submitting": "Envoi en cours...",
  "claim.successToast": "Réclamation soumise avec succès",
  "claim.successDesc": "Votre numéro de réclamation est {id}. Conservez-le pour suivre votre dossier.",
  "claim.failToast": "Échec de la soumission",
  "claim.failDesc": "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
  "claim.invalidFiles": "Fichiers non valides",
  "claim.invalidFilesDesc": "Certains fichiers ont été refusés. Seuls les PDF, PNG et JPG de 10 Mo ou moins sont acceptés.",
  "claim.commissionRequired": "Vous devez accepter la structure de commission pour soumettre une réclamation",
  "claim.consentRequired": "Vous devez accepter les conditions et ententes pour soumettre une réclamation",

  "status.sectionTitle": "Suivez votre réclamation",
  "status.sectionLead": "Suivez l'avancement de votre réclamation grâce à votre numéro unique. Obtenez des mises à jour en temps réel.",
  "status.heading": "Vérifier l'état d'une réclamation",
  "status.help": "Entrez votre numéro de réclamation pour suivre votre dossier",
  "status.placeholder": "Numéro de réclamation (p. ex. YUL-abc123-def456)",
  "status.search": "Rechercher",
  "status.searching": "Recherche...",
  "status.notFound": "Réclamation introuvable. Vérifiez votre numéro et réessayez.",
  "status.details": "Détails de la réclamation",
  "status.claimId": "Numéro :",
  "status.passenger": "Passager :",
  "status.status": "État :",
  "status.submittedOn": "Soumise le :",
  "status.compensation": "Indemnisation :",
  "status.commission": "Notre commission (15 %) :",
  "status.youReceive": "Vous recevez :",
  "status.nextSteps": "Prochaines étapes",
  "status.label.submitted": "Soumise",
  "status.label.under-review": "En révision",
  "status.label.approved": "Approuvée",
  "status.label.rejected": "Refusée",
  "status.label.paid": "Payée",
  "status.msg.submitted": "Votre réclamation a été soumise et notre équipe l'examine.",
  "status.msg.under-review": "Votre réclamation est en cours d'examen auprès de la compagnie. Nous vous tiendrons au courant.",
  "status.msg.approved": "Félicitations! Votre réclamation est approuvée. Le paiement est en cours de traitement.",
  "status.msg.rejected": "Malheureusement, votre réclamation n'est pas admissible à une indemnisation en vertu du RPPA.",
  "status.msg.paid": "Votre indemnisation a été versée! Merci d'avoir utilisé notre service.",

  "faq.title": "Foire aux questions",
  "faq.lead": "Questions fréquentes sur notre commission de 15 % et le processus de réclamation",
  "faq.placeholder": "Chercher dans la FAQ ou poser une question...",
  "faq.listening": "🎤 À l'écoute... Cliquez sur le micro pour arrêter",
  "faq.assistant": "Réponse de l'assistant",
  "faq.close": "Fermer",
  "faq.loading": "Chargement de la FAQ...",
  "faq.noResults": "Aucun résultat pour « {q} ». Posez la question à notre assistant!",
  "faq.processing": "Traitement...",
  "faq.askButton": "Assistant FAQ",
  "faq.stillTitle": "Encore des questions sur notre commission?",
  "faq.stillLead": "Notre assistant FAQ répond aux questions sur les frais, les délais de traitement et le calcul de la commission.",
  "faq.unavailable": "Assistant indisponible",
  "faq.unavailableDesc": "Veuillez réessayer plus tard ou contacter notre équipe.",
  "faq.voiceUnsupported": "Recherche vocale non prise en charge",
  "faq.voiceUnsupportedDesc": "Veuillez utiliser un navigateur récent avec reconnaissance vocale.",
  "faq.voiceError": "Erreur de reconnaissance vocale",
  "faq.voiceErrorDesc": "Veuillez réessayer ou taper votre question.",
  "faq.voiceFailed": "Échec de la recherche vocale",
  "faq.voiceFailedDesc": "Veuillez plutôt taper votre question.",
  "faq.q1": "Comment fonctionne la commission de 15 %?",
  "faq.a1": "Nous ne facturons notre commission de 15 % que si votre réclamation réussit. Si vous recevez 700 $, nous déduisons 105 $ (15 %) et vous versons 595 $. Si la réclamation échoue, vous ne payez rien.",
  "faq.q2": "Quelle est la différence entre une réclamation avec procuration et sans?",
  "faq.a2": "Avec une procuration, nous percevons l'indemnisation directement auprès de la compagnie, déduisons nos 15 % et vous versons le reste. Sans procuration, la compagnie vous paie directement et nous vous facturons ensuite les 15 %.",
  "faq.q3": "Y a-t-il des frais cachés en plus des 15 %?",
  "faq.a3": "Aucuns frais cachés. Notre commission de 15 % est le seul montant facturé, et seulement si votre réclamation réussit. Aucuns frais initiaux ni frais de traitement.",
  "faq.q4": "Combien de temps prend une réclamation?",
  "faq.a4": "Les compagnies ont 30 jours pour répondre en vertu du RPPA. En cas de refus, nous pouvons porter le dossier à l'Office des transports du Canada, ce qui peut prendre plusieurs mois. Nous vous informons à chaque étape.",

  "footer.tagline": "Obtenez l'indemnisation qui vous revient pour vos vols retardés ou annulés. Commission transparente de 15 %, aucun gain, aucuns frais.",
  "footer.promise": "Notre promesse",
  "footer.p1": "Seulement 15 % si vous gagnez",
  "footer.p2": "Aucuns frais initiaux",
  "footer.p3": "Tarification transparente",
  "footer.p4": "Déduction directe avec procuration",
  "footer.services": "Services",
  "footer.submit": "Soumettre une réclamation",
  "footer.track": "Suivre ma réclamation",
  "footer.calculator": "Calculateur de commission",
  "footer.guide": "Guide des droits RPPA",
  "footer.support": "Soutien",
  "footer.faq": "FAQ",
  "footer.contact": "Nous joindre",
  "footer.privacy": "Politique de confidentialité",
  "footer.terms": "Conditions d'utilisation",
  "footer.rights": `© {year} ${BRAND_NAME}. Tous droits réservés. Conforme à la LPRPDE et à la Loi 25.`,

  "auth.loginTitle": `Connexion à ${BRAND_NAME}`,
  "auth.loginLead": "Suivez vos réclamations et gérez votre compte",
  "auth.email": "Adresse courriel",
  "auth.password": "Mot de passe",
  "auth.signIn": "Se connecter",
  "auth.signingIn": "Connexion...",
  "auth.newHere": "Nouveau ici?",
  "auth.createAccount": "Créer un compte",
  "auth.backHome": "Retour à l'accueil",
  "auth.forgot": "Mot de passe oublié?",
  "auth.welcomeBack": "Bon retour",
  "auth.signedInAs": "Connecté en tant que {email}",
  "auth.loginFailed": "Échec de la connexion",
  "auth.registerTitle": `Inscription à ${BRAND_NAME}`,
  "auth.registerLead": "Créez votre compte pour soumettre et suivre vos réclamations",
  "auth.personal": "Renseignements personnels",
  "auth.firstName": "Prénom *",
  "auth.lastName": "Nom *",
  "auth.emailRequired": "Adresse courriel *",
  "auth.passwordRequired": "Mot de passe *",
  "auth.confirmPassword": "Confirmer le mot de passe *",
  "auth.minChars": "Au moins 8 caractères.",
  "auth.create": "Créer mon compte",
  "auth.creating": "Création du compte...",
  "auth.haveAccount": "Déjà un compte?",
  "auth.signInHere": "Connectez-vous ici",
  "auth.explore": "Vous voulez d'abord explorer?",
  "auth.goHome": "Retour à l'accueil",
  "auth.registered": "Inscription réussie",
  "auth.registeredDesc": "Votre compte est créé et vous êtes connecté. Consultez votre boîte de réception pour confirmer votre courriel.",
  "auth.registerFailed": "Échec de l'inscription",
  "auth.passwordsMismatch": "Les mots de passe ne correspondent pas",
  "auth.confirmRequired": "Veuillez confirmer votre mot de passe",
  "auth.forgotTitle": "Réinitialiser votre mot de passe",
  "auth.forgotLead": "Entrez votre courriel et nous vous enverrons un lien pour choisir un nouveau mot de passe.",
  "auth.sendLink": "Envoyer le lien",
  "auth.sending": "Envoi...",
  "auth.forgotSent": "Si un compte existe pour ce courriel, un lien de réinitialisation est en route. Vérifiez votre boîte de réception et vos pourriels.",
  "auth.resetTitle": "Choisissez un nouveau mot de passe",
  "auth.resetLead": "Entrez un nouveau mot de passe pour votre compte.",
  "auth.newPassword": "Nouveau mot de passe",
  "auth.resetButton": "Mettre à jour le mot de passe",
  "auth.resetting": "Mise à jour...",
  "auth.resetDone": "Votre mot de passe est mis à jour et vous êtes connecté.",
  "auth.resetFailed": "Impossible de réinitialiser le mot de passe",
  "auth.resetInvalid": "Ce lien est invalide ou expiré. Demandez-en un nouveau.",

  "consent.required": "Consentements requis",
  "consent.allAgree": `J'ai lu et j'accepte l'ensemble des conditions d'utilisation et ententes de ${BRAND_NAME}. *`,
  "consent.terms": "Conditions d'utilisation",
  "consent.privacy": "Politique de confidentialité",
  "consent.retention": "Politique de conservation des données",
  "consent.marketing": "courriels promotionnels",
  "consent.marketingPrefix": "J'accepte de recevoir des",
  "consent.optional": "(facultatif)",
  "consent.preAgreed": "✓ Vous avez déjà accepté nos conditions d'utilisation, notre politique de confidentialité et notre politique de conservation lors de votre inscription.",
  "consent.claimTitle": "Consentements propres à la réclamation",
  "consent.poa": "Entente de procuration",
  "consent.poaRequired": "Requis pour le traitement de votre réclamation",
  "consent.marketingHelp": "Nouvelles sur votre réclamation et améliorations du service",
  "consent.close": "Fermer",
  "consent.docTitle.terms": "Conditions d'utilisation",
  "consent.docTitle.privacy": "Politique de confidentialité",
  "consent.docTitle.dataRetention": "Politique de conservation des données",
  "consent.docTitle.poa": "Entente de procuration",
  "consent.docTitle.emailMarketing": "Consentement aux courriels promotionnels",
  "consent.doc.terms": `Conditions d'utilisation
${BRAND_NAME}

La présente entente régit votre utilisation du service ${BRAND_NAME}.

1.1 Description du service
Nous aidons au traitement des réclamations pour perturbations de vol en vertu du Règlement sur la protection des passagers aériens (RPPA) du Canada, pour les vols à destination, en provenance ou à l'intérieur du Canada.

1.2 Commission
Une commission de 15 % (p. ex. 105 $ sur une réclamation de 700 $) est facturée uniquement si la réclamation réussit. Vous recevez les 85 % restants (p. ex. 595 $).

1.3 Obligations de l'utilisateur
Vous devez fournir des renseignements exacts : numéro de vol, date, durée du retard, raison donnée par la compagnie et carte d'embarquement. Toute fausse déclaration peut entraîner le rejet de la réclamation.

1.4 Limites
L'indemnisation n'est pas garantie et dépend de la responsabilité de la compagnie en vertu du RPPA. Nous ne sommes pas responsables des refus ou des délais des compagnies.

1.5 Règlement des différends
Écrivez-nous à ${SUPPORT_EMAIL}. Nous répondons dans les 48 heures, conformément à la Loi sur la protection du consommateur du Québec.

1.6 Acceptation
En cochant la case, vous acceptez ces conditions.`,
  "consent.doc.privacy": `Politique de confidentialité
${BRAND_NAME}

Cette politique décrit comment nous traitons vos renseignements personnels, conformément à la LPRPDE du Canada et à la Loi 25 du Québec.

1.1 Données recueillies
Nous recueillons : nom, courriel, numéro de vol, date du vol, durée du retard, raison du retard et carte d'embarquement.

1.2 Utilisation
Les données servent au traitement des réclamations, aux démarches auprès des compagnies et aux mises à jour par courriel (promotionnelles seulement avec consentement).

1.3 Conservation
Les données sont conservées dans notre base de données chiffrée pendant 1 an, conformément au RPPA, même si vous supprimez votre compte.

1.4 Partage
Les données sont partagées avec les compagnies aériennes et les organismes de réglementation aux fins des réclamations. Aucun autre partage avec des tiers.

1.5 Vos droits
Vous pouvez consulter, corriger ou supprimer vos données (sauf celles des réclamations, selon le RPPA). Écrivez à ${SUPPORT_EMAIL}.

1.6 Acceptation
En cochant la case, vous acceptez cette politique.`,
  "consent.doc.dataRetention": `Consentement à la conservation des données
${BRAND_NAME}

Ce consentement porte sur la conservation des données exigée par le RPPA.

1.1 Conservation
Les données de réclamation (détails du vol, carte d'embarquement) sont conservées 1 an, conformément au RPPA, même si vous supprimez votre compte.

1.2 Vos droits
Vous pouvez supprimer vos données personnelles (nom, courriel), mais les données de réclamation sont conservées à des fins réglementaires. Écrivez à ${SUPPORT_EMAIL}.

1.3 Conformité
Conforme à la LPRPDE et à la Loi 25 du Québec.

1.4 Acceptation
En cochant la case, vous reconnaissez la conservation des données de réclamation.`,
  "consent.doc.poa": `Entente de procuration
${BRAND_NAME}

Cette entente autorise notre service à agir en votre nom pour les réclamations RPPA.

1.1 Portée
Nous sommes autorisés à soumettre des réclamations, à négocier et à percevoir l'indemnisation pour la perturbation de vol indiquée.

1.2 Commission
Nous déduisons une commission de 15 % (p. ex. 105 $ sur 700 $) et vous versons les 85 % restants (p. ex. 595 $).

1.3 Consentement
Vous accordez ce pouvoir par voie électronique. Vous pouvez le révoquer avec un préavis de 7 jours à ${SUPPORT_EMAIL}.

1.4 Conformité
Cette entente est conforme au Code civil du Québec et à la Loi sur la protection du consommateur.

1.5 Acceptation
En cochant la case, vous accordez cette procuration.`,
  "consent.doc.emailMarketing": `Consentement aux courriels promotionnels
${BRAND_NAME}

Ce consentement nous permet de vous envoyer des courriels promotionnels.

1.1 Portée
Vous acceptez de recevoir des courriels sur les droits des passagers, les nouveautés du service et nos offres.

1.2 Désabonnement
Désabonnez-vous à tout moment via le lien dans nos courriels ou en écrivant à ${SUPPORT_EMAIL}.

1.3 Conformité
Conforme à la Loi canadienne anti-pourriel (LCAP) et à la LPRPDE.

1.4 Acceptation
En cochant la case, vous consentez à recevoir des courriels promotionnels.`,

  "my.title": "Mes réclamations",
  "my.lead": "Toutes les réclamations liées à votre compte, avec leur état actuel.",
  "my.none": "Vous n'avez pas encore soumis de réclamation.",
  "my.newClaim": "Soumettre une réclamation",
  "my.verifyBanner": "Votre adresse courriel n'est pas encore confirmée. Confirmez-la pour que nous puissions vous joindre au sujet de vos réclamations.",
  "my.resend": "Renvoyer le courriel de confirmation",
  "my.resent": "Courriel de confirmation envoyé. Vérifiez votre boîte de réception.",
  "my.verifiedToast": "Courriel confirmé. Merci!",
  "my.flight": "Vol",
  "my.submittedOn": "Soumise le",
  "my.estimate": "Indemnisation estimée",
  "my.pendingReview": "En attente de vérification",
  "my.history": "Historique",
  "my.documents": "{n} document(s) téléversé(s)",

  "appr.title": "Avis d'admissibilité RPPA",
  "appr.msg.weather": "Les conditions météorologiques sont considérées comme des circonstances extraordinaires selon le RPPA et ne donnent pas droit à une indemnisation.",
  "appr.msg.atc": "Les restrictions du contrôle aérien sont hors du contrôle de la compagnie et ne sont pas indemnisables.",
  "appr.msg.security": "Les incidents de sécurité sont des circonstances extraordinaires non couvertes par le RPPA.",
  "appr.msg.airport_failure": "Les problèmes d'exploitation de l'aéroport sont hors du contrôle de la compagnie et ne sont pas indemnisables.",
  "appr.msg.safety_maintenance": "L'entretien lié à la sécurité est exigé par la loi et n'est pas indemnisable en vertu du RPPA.",
  "appr.msg.third_party_strikes": "Les grèves de tiers sont des circonstances extraordinaires hors du contrôle de la compagnie.",
  "appr.msg.government_delays": "Les retards gouvernementaux ou réglementaires sont hors du contrôle de la compagnie et ne sont pas indemnisables.",
  "appr.msg.medical_emergencies": "Les urgences médicales sont des circonstances extraordinaires non couvertes par le RPPA.",
  "appr.msg.cyberattacks": "Les cyberattaques sont des circonstances extraordinaires hors des opérations normales de la compagnie.",
  "appr.msg.default": "Cette raison de retard ne donne pas droit à une indemnisation en vertu du RPPA canadien.",
  "appr.alternatives": "Bon à savoir :",
  "appr.alt1": "Les compagnies se trompent parfois de raison. Nous pouvons leur demander de la justifier.",
  "appr.alt2": "Les vols internationaux peuvent être admissibles en vertu de la Convention de Montréal.",
  "appr.alt3": "Vérifiez la couverture de votre assurance voyage.",
  "appr.understand": "J'ai compris",
  "appr.learnMore": "En savoir plus sur le RPPA",
  "appr.submitAnyway": "Soumettre quand même pour vérification",
  "appr.submitAnywayHelp": "Aucuns frais sauf si nous gagnons. Notre équipe vérifiera la raison donnée par la compagnie.",

  "guide.back": "Retour à l'accueil",
  "guide.title": "Guide d'indemnisation RPPA canadien",
  "guide.lead": "Comprendre quelles perturbations de vol donnent droit à une indemnisation en vertu du Règlement sur la protection des passagers aériens (RPPA).",
  "guide.overview": "Aperçu",
  "guide.overviewText": "Le RPPA oblige les compagnies aériennes à indemniser les passagers pour les retards et annulations attribuables à la compagnie et non liés à la sécurité, ainsi que pour les refus d'embarquement.",
  "guide.amounts": "Montants d'indemnisation (par passager, selon le retard à l'arrivée) :",
  "guide.large": "Grands transporteurs (Air Canada, WestJet, 2 M+ passagers/an) :",
  "guide.small": "Petits transporteurs (moins de 2 M passagers/an) :",
  "guide.denied": "Refus d'embarquement (toute compagnie) :",
  "guide.admissible": "Raisons de retard admissibles",
  "guide.admissibleLead": "Ces retards sont attribuables à la compagnie, non liés à la sécurité, et donnent droit à une indemnisation.",
  "guide.inadmissible": "Raisons de retard non admissibles",
  "guide.inadmissibleLead": "Il s'agit de circonstances extraordinaires hors du contrôle de la compagnie ou de questions de sécurité.",
  "guide.resources": "Ressources supplémentaires",
  "guide.cta": "Règlement officiel RPPA (OTC)",
  "guide.notes": "À retenir :",
  "guide.note1": "La compagnie doit vous avoir informé du retard ou de l'annulation moins de 14 jours avant le départ pour qu'une indemnisation s'applique",
  "guide.note2": "La compagnie a 30 jours pour répondre à une réclamation; un dossier non résolu peut être porté à l'Office des transports du Canada",
  "guide.note3": "Les vols internationaux peuvent aussi être couverts par la Convention de Montréal",
  "guide.note4": "Conservez tous vos reçus et documents liés à la perturbation",

  "clippy.name": "Assistant Côney",
  "clippy.moreTips": "Autres conseils",
  "clippy.show": "Afficher l'assistant",
  "clippy.clickHelp": "Cliquez pour de l'aide!",
  "clippy.welcome": "Salut! Je suis Côney, votre cône de construction montréalais. Je vous guide dans l'indemnisation de vol comme dans le trafic de Montréal : avec style!",
  "clippy.claim-start": "Super! Vous commencez une réclamation. Astuce : ayez en main votre carte d'embarquement, votre confirmation de vol et tout avis de retard pour un traitement plus rapide.",
  "clippy.documentation": "Documentez tout! Téléversez des photos nettes de votre carte d'embarquement, des annonces de retard, des bons de repas et des reçus d'hôtel fournis par la compagnie.",
  "clippy.commission-info": "Notre commission transparente de 15 % n'est facturée que si nous GAGNONS votre dossier. Pas de succès = pas de frais. Vous gardez 85 % de l'indemnisation!",
  "clippy.poa-explanation": "La procuration est une pratique courante qui nous permet de négocier directement avec les compagnies. C'est sécuritaire et révocable en tout temps!",
  "clippy.delay-tip": "Bon à savoir : au Canada, un retard de 3 h et plus attribuable à la compagnie vaut de 125 $ à 1 000 $, et un refus d'embarquement jusqu'à 2 400 $!",
  "clippy.tracking-help": "Perdu les détails de votre réclamation? Pas de souci! Utilisez votre numéro de réclamation pour suivre le dossier. Nous envoyons aussi des mises à jour par courriel.",
  "clippy.faq-tip": "Des questions? Consultez notre FAQ ou demandez-moi directement : je connais tous les trucs des compagnies!",
  "clippy.easter-egg": "Eh! Vous m'avez trouvé! Je suis Côney le cône, le directeur de trafic préféré de Montréal, maintenant au service des passagers retardés. La saison des travaux ne finit jamais!",
  "clippy.delay-reason-valid": "Bonne nouvelle! Cette raison de retard est généralement admissible. Les compagnies sont responsables des problèmes d'équipage, d'entretien et d'exploitation.",
  "clippy.delay-reason-invalid": "Attention! Cette raison est habituellement considérée comme une « circonstance extraordinaire » : les compagnies n'ont généralement pas à indemniser pour la météo, le contrôle aérien ou la sécurité.",
  "clippy.airline-large": "Vous avez affaire à un grand transporteur! Il paie les montants RPPA les plus élevés (400 $ à 1 000 $), mais ses processus peuvent être plus complexes.",
  "clippy.airline-small": "C'est un petit transporteur avec des montants RPPA plus bas (125 $ à 500 $), mais souvent des processus plus simples et des réponses plus rapides.",

  "unsub.title": "Vous êtes désabonné",
  "unsub.text": "Vous ne recevrez plus de courriels promotionnels de notre part. Les mises à jour de vos réclamations ne sont pas touchées.",
  "unsub.invalid": "Ce lien de désabonnement est invalide. Écrivez-nous à " + SUPPORT_EMAIL + " et nous vous retirerons manuellement.",


  "sign.title": "Signez votre procuration",
  "sign.lead": "Elle nous permet de réclamer en votre nom. Une minute suffit : lisez, dessinez votre signature, tapez votre nom.",
  "sign.claim": "Réclamation",
  "sign.flight": "Vol",
  "sign.estimate": "Indemnisation estimée",
  "sign.commission": "Notre commission (15 %, seulement si vous gagnez)",
  "sign.readDoc": "Lire la procuration complète",
  "sign.draw": "Dessinez votre signature ci-dessous (souris ou doigt)",
  "sign.clear": "Effacer",
  "sign.typedName": "Tapez votre nom légal complet",
  "sign.agree": "J'ai lu la procuration et je la signe électroniquement. Je comprends qu'elle a la même valeur qu'une signature manuscrite.",
  "sign.button": "Signer la procuration",
  "sign.signing": "Signature...",
  "sign.done": "Signée! Une copie vous a été envoyée par courriel.",
  "sign.alreadySigned": "Cette procuration a déjà été signée le {date}.",
  "sign.download": "Télécharger le PDF signé",
  "sign.invalid": "Ce lien n'est pas valide. Ouvrez-le depuis la page Mes réclamations ou depuis notre courriel.",
  "sign.needSignature": "Veuillez d'abord dessiner votre signature.",
  "sign.failed": "Signature impossible",
  "sign.backToClaims": "Aller à Mes réclamations",

  "my.signPoa": "Signer la procuration",
  "my.poaSigned": "Procuration signée",
  "my.downloadPoa": "Télécharger la procuration",
  "my.payCommission": "Payer la commission",
  "my.commissionPaid": "Commission payée",
  "my.paidToast": "Merci, votre paiement a été reçu.",
  "my.paidCancelled": "Le paiement a été annulé. Vous pouvez réessayer depuis votre réclamation.",
  "my.airlineDeadline": "Réponse de la compagnie attendue le",
  "my.escalated": "Porté à l'OTC",

  "common.loading": "Chargement...",
  "common.cad": "$ CA",
};

-- ArTova — données de démarrage (artistes fictifs d'exemple, comptes de démonstration)
USE artova;

INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, role) VALUES
('ArTova Administration', 'admin@artova.tg', '$2b$12$UfC8CyYheYWxeDYlKnFg3.NJO7Iid2ntcOgQhlJKn.OHrRHQ6rljK', '+228 90 00 00 00', 'admin'),
('Awa Démé', 'client@artova.tg', '$2b$12$QQnximU/Y22f8/T90U8YcuNNMtS0gqP2JN/Uo7vfLcGwXpRKv4SBa', '+228 91 00 00 00', 'client');

INSERT INTO artistes (slug, nom, discipline, ville, histoire, note_univers, theme_primaire, theme_accent, theme_fond, motif, portrait_url) VALUES
('kossi-agbeko', 'Kossi Agbeko', 'peintre', 'Lomé',
 'Né à Lomé en 1979, Kossi Agbeko grandit entre le quartier d''Adawlato et les rives de la lagune Ébrié togolaise, où les pirogues rentrent chargées de lumières. Autodidacte, il peint d''abord sur des sacs de riz récupérés, puis expose dans les cours communes de la capitale. Sa peinture cherche le point exact où la nuit rencontre l''or : celui des lampes de pêcheurs reflétées dans l''eau noire. Aujourd''hui, ses toiles voyagent entre Lomé, Accra et Paris, mais il continue de peindre chaque matin face à l''océan, à Aného.',
 'Indigo profond, or et gestes larges : l''univers de Kossi est une marée nocturne traversée de lumière.',
 '#1E2A78', '#D9A441', '#F4F0E6', 'pinceau', '/images/artistes/kossi-agbeko.jpg'),
('adjovi-klousseh', 'Adjovi Klousseh', 'plasticien', 'Aného',
 'Adjovi Klousseh collecte ce que la ville jette : chutes de wax, perles de verre, pages de journaux, cordes de raphia. Née à Aného en 1990, formée à l''École supérieure d''art de Lomé, elle tisse ces fragments en mémoires collectives — chaque tissu porte une main, chaque perle un trajet. Ses assemblages célèbrent les femmes des marchés et les gestes transmis de mère en fille. Son travail a été présenté à la Biennale de Dakar et au centre culturel franco-togolais.',
 'Magenta, turquoise et matières récupérées : un univers-collage où chaque fragment raconte un trajet.',
 '#B01E68', '#12A19B', '#FBF1F5', 'collage', '/images/artistes/adjovi-klousseh.jpg'),
('yao-kpodzro', 'Yao Kpodzro', 'sculpteur', 'Kpalimé',
 'À Kpalimé, au pied des collines de caféiers, Yao Kpodzro taille l''ébéne et coule le bronze depuis trente ans. Apprenti à douze ans auprès de son oncle forgeron, il a hérité du geste qui écoute la matière : « le bois dit où il veut aller », répète-t-il. Ses figures élancées veillent sur les seuils — gardiens silencieux inspirés des sculptures traditionnelles ewe revisitées par la modernité. Ses bronzes, coulés à la cire perdue, portent la patine du temps et celle des mains.',
 'Bronze, ébène et terre : des formes élancées veillant sur les seuils, entre tradition ewe et modernité.',
 '#8C5A2B', '#A65A41', '#F3EDE3', 'pierre', '/images/artistes/yao-kpodzro.jpg');

INSERT INTO oeuvres (artiste_id, titre, type, prix_fcfa, annee, dimensions, technique, description, image_url, oeuvre_maitre) VALUES
(1, 'Marée d''encre', 'toile', 850000, 2025, '140 × 110 cm', 'Acrylique et feuille d''or sur toile',
 'La toile maîtresse de Kossi : une nuit de lagune où l''encre indigo se déchire sous des gestes d''or. Peinte en trois nuits blanches face à l''océan d''Aného.', '/images/oeuvres/kossi-maree-dencre.jpg', 1),
(1, 'Femme ochre', 'toile', 620000, 2024, '100 × 80 cm', 'Huile sur toile',
 'Portrait en profil traité en empâtements : la terre ochre et le bleu profond se répondent pour dire la dignité silencieuse des femmes du marché.', '/images/oeuvres/kossi-femme-ochre.jpg', 0),
(1, 'Marché de Lomé', 'toile', 740000, 2023, '120 × 90 cm', 'Acrylique sur toile',
 'Une chorale de formes et de silhouettes : le grand marché de Lomé vu comme une partition de couleurs en mouvement.', '/images/oeuvres/kossi-marche-de-lome.jpg', 0),
(2, 'Mémoires tissées', 'toile', 690000, 2025, '130 × 100 cm', 'Wax, perles de verre, broderies et collages sur toile',
 'Œuvre maîtresse d''Adjovi : trois générations de tissus récupérés auprès des couturières d''Aného, cousus et perlés en une seule mémoire.', '/images/oeuvres/adjovi-memoires-tissees.jpg', 1),
(2, 'Écho textile', 'toile', 480000, 2024, '110 × 90 cm', 'Raphia teint et tissus recyclés assemblés',
 'Blocs de couleur tissés de cordes et de raphia : le rythme géométrique des pagnes séchant au vent de la côte.', '/images/oeuvres/adjovi-echo-textile.jpg', 0),
(2, 'Totem retrouvé', 'sculpture', 950000, 2025, 'H. 165 cm', 'Assemblage de métal, tissus et perles',
 'Un totem d''objets retrouvés — tôles peintes, ballots de tissu, fils de fer — qui redresse la mémoire des choses jetées.', '/images/oeuvres/adjovi-totem-retrouve.jpg', 0),
(3, 'Gardien de bronze', 'sculpture', 1450000, 2024, 'H. 92 cm', 'Bronze fondu à la cire perdue',
 'La sculpture maîtresse de Yao : une figure debout, sereine, coulée à la cire perdue selon le geste hérité de son oncle forgeron. Elle veille sur les seuils.', '/images/oeuvres/yao-gardien-de-bronze.jpg', 1),
(3, 'Assise d''ébène', 'sculpture', 1150000, 2023, 'H. 78 cm', 'Ébène sculpté et poli à la main',
 'Une figure assise taillée dans un seul bloc d''ébène : les courbes suivent le grain du bois, « là où il voulait aller ».', '/images/oeuvres/yao-assise-debene.jpg', 0),
(3, 'Terre sigillée', 'sculpture', 560000, 2025, 'H. 45 cm', 'Terre cuite gravée',
 'Un vase-forme organique gravé de symboles ewe : la terre de Kpalimé cuite en rouge de braise.', '/images/oeuvres/yao-terre-sigillee.jpg', 0);

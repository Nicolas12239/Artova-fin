-- ArTova : données de démarrage (comptes de démonstration). Les artistes sont créés par les artistes eux-mêmes.
USE artova;

INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, role) VALUES
('ArTova Administration', 'admin@artova.tg', '$2b$12$UfC8CyYheYWxeDYlKnFg3.NJO7Iid2ntcOgQhlJKn.OHrRHQ6rljK', '+228 90 00 00 00', 'admin'),
('Awa Démé', 'client@artova.tg', '$2b$12$QQnximU/Y22f8/T90U8YcuNNMtS0gqP2JN/Uo7vfLcGwXpRKv4SBa', '+228 91 00 00 00', 'client');

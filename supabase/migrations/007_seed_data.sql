-- Verified from src/lib/data.ts DEFAULT_ROLES

INSERT INTO public.roles (id, name, type, keywords, count, "isActive") VALUES
('dev-ft', 'Web/App Developer', 'Full-time', '{"react","node","javascript","typescript","python","flutter","nextjs","mongodb","sql","api","git","css","html","aws","docker"}', 0, true),
('dev-in', 'Dev Intern', 'Intern', '{"javascript","html","css","react","python","git","basics","intern"}', 0, true),
('designer', 'Graphic Designer', 'Full-time', '{"figma","photoshop","illustrator","canva","branding","typography","ui","ux","adobe","design"}', 0, true),
('editor', 'Video Editor', 'Full-time', '{"premiere","after effects","davinci","final cut","color grading","motion graphics","editing","capcut","video"}', 0, true),
('dmarketer', 'Digital Marketer', 'Full-time', '{"seo","sem","google ads","meta ads","analytics","email marketing","hubspot","campaigns","digital"}', 0, true),
('smm', 'Social Media Manager', 'Full-time', '{"instagram","social media","content creation","reels","scheduling","analytics","engagement","tiktok","facebook"}', 0, true),
('sales', 'Sales Executive', 'Full-time', '{"sales","crm","b2b","b2c","negotiation","lead generation","revenue","target","closing","salesforce"}', 0, true),
('perfmkt', 'Performance Marketer', 'Full-time', '{"google ads","meta ads","roas","cpc","cpm","ppc","remarketing","a/b testing","conversion","performance"}', 0, true),
('content', 'Content Strategist', 'Full-time', '{"content strategy","copywriting","seo","storytelling","editorial","blogging","audience","brand voice"}', 0, true),
('model-m', 'Model (Male)', 'Freelance', '{"modelling","portfolio","commercial","editorial","runway","brand","male model"}', 0, true),
('model-f', 'Model (Female)', 'Freelance', '{"modelling","portfolio","commercial","editorial","runway","brand","female model"}', 0, true),
('camera', 'Cameraman', 'Full-time', '{"cinematography","camera","lighting","dslr","video production","shoot","lens","stabilizer","drone"}', 0, true)
ON CONFLICT (id) DO NOTHING;

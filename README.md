# Handcraft Myanmar website

This package is designed for **GitHub Pages + Supabase**.

## Included
- Home page
- About Us
- Our Projects
- Category filters
- Contact section
- Google Maps embed
- Mobile responsive design
- Secure Supabase login for the admin panel
- Project upload with image storage
- Add/edit/delete projects
- Publish/unpublish projects
- Project categories

## 1. Create Supabase
Create a Supabase project, then run `supabase-schema.sql` in the SQL Editor.
Create your admin user under Authentication > Users.

Do not put a Supabase service-role/secret key in this website. Only use the publishable/anon key.

## 2. Configure the site
Open:
- `assets/app.js`
- `admin/admin.js`

Replace:
YOUR_SUPABASE_URL
YOUR_SUPABASE_PUBLISHABLE_KEY

with your project's URL and publishable key.

Replace the contact details in `index.html` and the Google Maps iframe URL.

## 3. GitHub Pages
Create a public repository, upload all files, then enable GitHub Pages from the repository's Pages settings.

The site will be available at:
https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY/

## 4. Custom domain
For `handcraft.com.mm`, GitHub's current recommended apex-domain records are:

A @ 185.199.108.153
A @ 185.199.109.153
A @ 185.199.110.153
A @ 185.199.111.153

For `www`:
CNAME www YOUR-GITHUB-USERNAME.github.io

In GitHub Pages, set the custom domain to:
handcraft.com.mm

GitHub can issue HTTPS after DNS is correctly configured.

If your .com.mm registrar requires nameserver changes rather than DNS records, do not guess them—ask the registrar which DNS record format they accept. Usually the easiest setup is to keep the existing DNS service and change the A/CNAME records.

## 5. Important security note
The admin UI is not protected by hiding the URL. Supabase Auth protects login, and database/storage policies protect operations. For a production deployment, create a dedicated admin account and do not share it.

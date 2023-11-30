# API docs

  > Auth

- `POST /auth/signin	`

  Untuk masuk ke dalam website menggunakan akun yang sudah ada, akan diminta untuk memasukkan :
  ```json
  {
    "email": "emailkamu@mail.com",
    "password": "passwordkamu"
  }
  ```

- `POST /auth/signup	`

  Jika belum punya akun, akan diminta untuk membuat akun terlebih dahulu dengan mendaftarkan :
  ```json
  {
    "username": "usernamekamu",
    "email": "emailkamu@mail.com",
    "password": "passwordkamu"
  }
  ```
---

> User

- `GET /users/profile	`

  Untuk melihat halaman profile dari user. Halaman profile berisi dashboard tentang artikel, education, dan workshop. Hanya Root dan Admin yang bisa melakukan CRUD pada artikel, edeucation, dan workshop.


- `GET /users/search	`

  Untuk mencari user yang diinginkan


- `GET /users/by-username/:username	`

  Untuk mendapatkan user yang diinginkan dengan memasukkan username nya


- `GET /users/by-role/:role	`

  Untuk mendapatkan user dengan role yang sama dengan memasukkan jenis role nya


- `PUT /users/:id/set-role	`

  Untuk mengganti role dari user yg diinginkan dengan memasukkan id user nya


- `PUT /users/:id/reset-role	`

  Untuk mengatur ulang role dari user yg diinginkan dengan memasukkan id user nya


- `PUT /users/:id	`

  Untuk mengubah data dari user yang diinginkan dengan memasukkan id nya


- `GET /users/:id	`

  Untuk mendapatkan user yang diinginkan dengan memasukkan id user nya


- `GET /users/	`

  Untuk mendapatkan semua user yang ada


- `DELETE /users/:id	`

  Untuk menghapus user yang diinginkan dengan memasukkan id user nya

---

  > Article

- `GET /articles/recommendation	`

  Untuk mendapatkan semua artikel yang ada


- `GET /articles/search	`

  Untuk mencari artikel yang diinginkan


- `GET /articles/	`

  Untuk mendapatkan semua artikel yang dibuat oleh user 


- `GET /articles/:id	`

  Untuk mendapatkan artikel yang diinginkan dengan memasukkan id artikel nya


- `POST /articles/	`

  Untuk membuat dan mengupload artikel


- `DELETE /articles/:id	`

  Untuk menghapus artikel yang diinginkan dengan memasukkan id artikel nya


- `PUT /articles/:id	`

  Untuk mengubah artikel yang diinginkan dengan memasukkan id artikel nya

---

  > Education

- `GET /educations/recommendation	`

  Untuk mendapatkan semua education yang ada


- `GET /educations/search	`

  Untuk mencari education yang diinginkan


- `GET /educations/	`

  Untuk mendapatkan semua education yang dibuat oleh user 


- `GET /educations/:id	`

  Untuk mendapatkan education yang diinginkan dengan memasukkan id education nya


- `POST /educations/	`

  Untuk membuat dan mengupload education


- `DELETE /educations/:id	`

  Untuk menghapus education yang diinginkan dengan memasukkan id education nya


- `PUT /educations/:id	`

  Untuk mengubah education yang diinginkan dengan memasukkan id education nya

---

  > Workshop

- `GET /workshops/recommendation	`

  Untuk mendapatkan semua workshop yang ada


- `GET /workshops/search	`

  Untuk mencari workshop yang diinginkan


- `GET /workshops/	`

  Untuk mendapatkan semua workshop yang dibuat oleh user

 
- `POST /workshops/:id/peserta	`

  Untuk menambahkan peserta workshop dengan memasukkan id workshop nya


- `GET /workshops/:id	`

  Untuk mendapatkan workshop yang diinginkan dengan memasukkan id workshop nya


- `POST /workshops/	`

  Untuk membuat dan mengupload workshop


- `DELETE /workshops/:id	`

  Untuk menghapus workshop yang diinginkan dengan memasukkan id workshop nya


- `PUT /workshops/:id	`

  Untuk mengubah workshop yang diinginkan dengan memasukkan id workshop nya

---

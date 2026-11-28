import { readFile, mkdir, writeFile } from "node:fs/promises";
import { one } from "./db.js";
import { hashPassword, verifyPassword } from "./security.js";
import { randomUUID } from "node:crypto";
import { BOOK_CATALOG } from "./book_catalog.js";
import { VERIFIED_COVERS } from "./verified_covers.js";

async function ensureBookCatalog(db) {
  if (!BOOK_CATALOG.length) return;
  await db.transaction(async (tx) => {
    const misspelled = await one(tx, "SELECT id FROM categories WHERE name='Truyện tranh tiếu nhi'");
    const canonical = await one(tx, "SELECT id FROM categories WHERE name='Truyện tranh thiếu nhi'");
    if (misspelled && canonical) {
      await tx.query("UPDATE products SET category_id=$1 WHERE category_id=$2", [canonical.id, misspelled.id]);
      await tx.query("DELETE FROM categories WHERE id=$1", [misspelled.id]);
    } else if (misspelled) {
      await tx.query("UPDATE categories SET name='Truyện tranh thiếu nhi' WHERE id=$1", [misspelled.id]);
    }
    const categoryIds = new Map();
    for (const name of [...new Set(BOOK_CATALOG.map((book) => book.category))]) {
      const category = await one(
        tx,
        "INSERT INTO categories(name,attributes) VALUES($1,'[]'::jsonb) ON CONFLICT(name) DO UPDATE SET active=TRUE RETURNING id",
        [name],
      );
      categoryIds.set(name, category.id);
    }
    const location = await one(tx, "SELECT id FROM locations WHERE active ORDER BY id LIMIT 1");
    if (!location) return;
    for (const book of BOOK_CATALOG) {
      const product = await one(
        tx,
        `INSERT INTO products(sku,name,category_id,price,description,image,datasheet,specs,unit)
         VALUES($1,$2,$3,$4,'',$5,$6,$7,'cuốn')
         ON CONFLICT(sku) DO UPDATE SET name=$2,category_id=$3,price=$4,image=CASE WHEN products.image='' THEN $5 ELSE products.image END,datasheet=$6,specs=$7,active=TRUE
         RETURNING id`,
        [
          book.sku,
          book.name,
          categoryIds.get(book.category),
          book.price,
          book.image || VERIFIED_COVERS[book.sku] || "",
          book.datasheet,
          JSON.stringify({ author: book.author }),
        ],
      );
      await tx.query(
        "INSERT INTO stock(product_id,location_id,quantity) VALUES($1,$2,20) ON CONFLICT DO NOTHING",
        [product.id, location.id],
      );
    }
  });
}

async function ensureDemoEmployee(db) {
  const demoUser = await one(db, "SELECT id FROM users WHERE phone='0999999999'");
  if (!demoUser) await db.query(
    "INSERT INTO users(phone,name,password,role,active,demo) VALUES('0999999999','Nhân viên dùng thử',$1,'employee',TRUE,TRUE)",
    [await hashPassword(randomUUID())],
  );
}

export async function initialize(
  db,
  { password, credentialDir = "./data", demo = true } = {},
) {
  // Chạy file schema.sql để tạo các bảng
  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );

  // Mặc định tài khoản chủ cửa hàng dùng số điện thoại chuẩn
  const ownerPhone = "0901234567";
  const pass = password || process.env.OWNER_PASSWORD || "123456";
  const writeCredentials = async () => {
    if (!credentialDir) return;
    await mkdir(credentialDir, { recursive: true });
    await writeFile(
      `${credentialDir}/first-login.txt`,
      `TAI KHOAN CHU CUA HANG (PINKBOOK MANAGER)\nSo dien thoai: ${ownerPhone}\nMat khau: ${pass}\n\nHay su dung so dien thoai tren de dang nhap. Doi mat khau trong muc Mat khau sau khi dang nhap.\n`,
      { mode: 0o600 },
    );
  };

  // Mật khẩu đã đổi trong web phải được giữ nguyên sau khi khởi động lại.
  const existingOwner = await one(db, "SELECT id,password FROM users WHERE role='owner' LIMIT 1");
  if (existingOwner) {
    await ensureBookCatalog(db);
    await ensureDemoEmployee(db);
    console.log(`Tài khoản quản lý: ${ownerPhone}`);
    if (await verifyPassword(pass, existingOwner.password)) {
      await writeCredentials();
      console.log(`Mật khẩu quản lý: ${pass}`);
    } else {
      if (credentialDir) {
        await mkdir(credentialDir, { recursive: true });
        await writeFile(`${credentialDir}/first-login.txt`, `TAI KHOAN CHU CUA HANG\nSo dien thoai: ${ownerPhone}\nMat khau da duoc doi trong web. Hay dung mat khau moi da dat.\n`, { mode: 0o600 });
      }
      console.log("Mật khẩu quản lý đã được đổi trong web; dùng mật khẩu mới đã đặt.");
    }
    return null;
  }

  // Nếu đã có dữ liệu nhưng thiếu owner thì tạo lại tài khoản quản lý mặc định.
  if (await one(db, "SELECT id FROM users LIMIT 1")) {
    await db.query(
      "INSERT INTO users(phone,email,name,password,role) VALUES($1,$2,$3,$4,'owner')",
      [ownerPhone, "owner@nhom31.local", "Chủ cửa hàng", await hashPassword(pass)],
    );
    await ensureBookCatalog(db);
    await ensureDemoEmployee(db);
    await writeCredentials();
    console.log(`Tài khoản quản lý: ${ownerPhone}`);
    console.log(`Mật khẩu quản lý: ${pass}`);
    return pass;
  }

  await db.transaction(async (tx) => {
    // 1. Tạo tài khoản chủ cửa hàng (Owner) với Số điện thoại
    await tx.query(
      "INSERT INTO users(phone,email,name,password,role) VALUES($1,$2,$3,$4,'owner')",
      [ownerPhone, "owner@nhom31.local", "Chủ cửa hàng", await hashPassword(pass)],
    );

    // 2. Cài đặt thông tin cửa hàng sách
    await tx.query(
      `INSERT INTO settings(id,store_name,phone,address,low_stock)
      VALUES(1,'PinkBook Store','0901234567','Hà Nội',10)
      ON CONFLICT (id) DO NOTHING`,
    );

    // 3. Khởi tạo danh mục sách & văn phòng phẩm
    await tx.query(
      "INSERT INTO categories(name,attributes) VALUES('Văn học',$1),('Kỹ năng sống',$2),('Khoa học - Công nghệ',$3),('Thiếu nhi',$4) ON CONFLICT(name) DO NOTHING",
      [
        JSON.stringify([
          { name: "Tác giả", unit: "" },
          { name: "Nhà xuất bản", unit: "" },
        ]),
        JSON.stringify([
          { name: "Tác giả", unit: "" },
          { name: "Số trang", unit: "trang" },
        ]),
        JSON.stringify([
          { name: "Chuyên ngành", unit: "" },
          { name: "Năm xuất bản", unit: "" },
        ]),
        JSON.stringify([
          { name: "Độ tuổi", unit: "tuổi" },
          { name: "Loại bìa", unit: "" },
        ]),
      ],
    );

    // 4. Khởi tạo vị trí lưu trữ trong kho sách
    await tx.query(
      "INSERT INTO locations(name) VALUES('Khu A • Kệ Văn Học'),('Khu B • Kệ Kỹ Năng'),('Khu C • Kho Tổng')",
    );

    // 5. Nhà cung cấp mẫu
    await tx.query(
      "INSERT INTO suppliers(name,phone,address) VALUES('Nhà Xuất Bản Trẻ','02839316289','TP. Hồ Chí Minh')",
    );

    if (demo && false) {
      // 6. Dữ liệu mẫu các tựa sách
      const data = [
        [
          "BK001",
          "Nhà Giả Kim",
          1,
          79000,
          "Cuốn tiểu thuyết nổi tiếng của Paulo Coelho về hành trình theo đuổi vận mệnh.",
          { "Tác giả": "Paulo Coelho", "Nhà xuất bản": "NXB Hội Nhà Văn" },
          "https://nxbhoidanvan.vn",
        ],
        [
          "BK002",
          "Đắc Nhân Tâm",
          2,
          86000,
          "Nghệ thuật thu phục lòng người và thay đổi cuộc sống của Dale Carnegie.",
          { "Tác giả": "Dale Carnegie", "Số trang": "320" },
          "",
        ],
        [
          "BK003",
          "Clean Code - Mã Sạch",
          3,
          185000,
          "Cẩm nang lập trình hướng dẫn viết code gọn gàng, dễ bảo trì.",
          { "Chuyên ngành": "Công nghệ thông tin", "Năm xuất bản": "2021" },
          "",
        ],
        [
          "BK004",
          "Dế Mèn Phiêu Lưu Ký",
          4,
          45000,
          "Tác phẩm văn học thiếu nhi kinh điển gắn liền với tuổi thơ.",
          { "Độ tuổi": "6-15", "Loại bìa": "Bìa mềm" },
          "",
        ],
      ];

      for (const [sku, name, cat, price, description, specs, datasheet] of data) {
        await tx.query(
          "INSERT INTO products(sku,name,category_id,price,description,specs,datasheet,unit) VALUES($1,$2,$3,$4,$5,$6,$7,'cuốn')",
          [
            sku,
            name,
            cat,
            price,
            description,
            JSON.stringify(specs),
            datasheet,
          ],
        );
      }

      // 7. Nhập kho ban đầu cho sách
      const lines = data.map((_, i) => ({
        product_id: i + 1,
        location_id: i < 2 ? 1 : 2,
        quantity: 50,
        cost: 0,
      }));

      const v = await one(
        tx,
        "INSERT INTO vouchers(type,status,supplier_id,reason,lines,created_by,confirmed_at) VALUES('in','confirmed',1,'Tồn kho đầu kỳ hệ thống quản lý sách PinkBook',$1,1,NOW()) RETURNING id",
        [JSON.stringify(lines)],
      );

      for (const l of lines) {
        await tx.query("INSERT INTO stock VALUES($1,$2,$3)", [
          l.product_id,
          l.location_id,
          l.quantity,
        ]);
        await tx.query(
          "INSERT INTO movements(voucher_id,product_id,location_id,delta,balance,actor) VALUES($1,$2,$3,$4,$4,1)",
          [v.id, l.product_id, l.location_id, l.quantity],
        );
      }
    }
  });

  await ensureBookCatalog(db);
  await ensureDemoEmployee(db);

  // 8. Lưu và in thông tin đăng nhập để dễ sao chép khi chạy lần đầu.
  await writeCredentials();
  console.log(`Tài khoản quản lý: ${ownerPhone}`);
  console.log(`Mật khẩu quản lý: ${pass}`);
  if (credentialDir) console.log(`Thông tin đăng nhập lưu tại: ${credentialDir}/first-login.txt`);

  return pass;
}

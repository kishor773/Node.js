const express = require("express");
const bodyparser = require("body-parser");

const fs = require("fs");
const mysql = require("mysql2");
const csv = require("fast-csv");
const path = require("path");
const multer = require("multer");

const app = express();

app.use(express.static("./public"));

app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

// Database connection
const database = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "selfservice",
});

database.connect(function (err) {
  if (err) {
    return console.error("error: " + err.message);
  }
  console.log("Connected to the MySQL server.");
});

var storage = multer.diskStorage({
  destination: (req, file, callBack) => {
    callBack(null, "./uploads/");
  },
  filename: (req, file, callBack) => {
    callBack(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({
  storage: storage,
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/csvfileupload", upload.single("csvfileupload"), (req, res) => {
  handleCsvFile(__dirname + "/uploads/" + req.file.filename);
  console.log("File uploaded :" + err);
});

function handleCsvFile(filePath) {
  let stream = fs.createReadStream(filePath);
  let csvRecordsArr = [];
  let csvDataStream = csv
    .parse()
    .on("data", function (data) {
      csvRecordsArr.push(data);
    })
    .on("end", function () {
      csvRecordsArr.shift();

      database.connect((error) => {
        if (error) {
          console.error(error);
        } else {
          //let query = 'INSERT INTO dyn_table_11_20220930 (LimitedName,VoucherNumber,Reference,Date,VoucherType,PartyAlias,PartyAddress,PartyPincode,PartyContactPerson,PartyTelephoneNo,PartyMobileNo,PartyFaxNo,PartyEmail,PartyGroup,PartyState,PartyNotes,DespatchDocNo,DespatchThrough,Destination,TrackingNumber,GSTIN_UIN,ItemName,ItemAlias,ItemPartNo,ItemGroup,ItemCategory,ItemDescription,ItemNotes,ItemTariffClass,MRP_Marginal,ItemHSN,ItemRateOfGST,Godown,ItemBatch,AcutalQuantity,BilledQuantity,AlternateActualQuantity,Rate,PurchaseRate,Unit,Discount,DiscountAmount,Margin,Amount,StandardCost,StandardPrice,Purchase_SalesLedger,Narration) VALUES ?';
          //let query = 'INSERT INTO dyn_table_11_20220930 ( ) VALUES ?';

        //   var { in_accounts_user_id, in_original_file_columns } = req.body;

          let query = `CALL selfservice.sp_add_data_to_dyn_tbl(@err,11,LimitedName,VoucherNumber,Reference,Date,VoucherType,PartyAlias,PartyAddress,PartyPincode,PartyContactPerson,PartyTelephoneNo,PartyMobileNo,PartyFaxNo,PartyEmail,PartyGroup,PartyState,PartyNotes,DespatchDocNo,DespatchThrough,Destination,TrackingNumber,GSTIN_UIN,ItemName,ItemAlias,ItemPartNo,ItemGroup,ItemCategory,ItemDescription,ItemNotes,ItemTariffClass,MRP_Marginal,ItemHSN,ItemRateOfGST,Godown,ItemBatch,AcutalQuantity,BilledQuantity,AlternateActualQuantity,Rate,PurchaseRate,Unit,Discount,DiscountAmount,Margin,Amount,StandardCost,StandardPrice,Purchase_SalesLedger,Narration,@flag,@dynamic_table_name,?);`;

        //   var args = [in_accounts_user_id, in_original_file_columns];

          database.query(query, [csvRecordsArr], (error, res) => {
            console.log(error || res);
          });

        //   commonController.executeQuery(query, args, (rows, err) => {
        //     if (err) {
        //       return res.status(500).json(err);
        //     }
        //     return res.status(200).json(rows);
        //   });
        }
      });

      fs.unlinkSync(filePath);
    });

  stream.pipe(csvDataStream);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Node app wokring on: ${PORT}`));

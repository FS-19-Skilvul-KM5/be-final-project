const User = require("../models/user");
const Workshop = require("../models/workshop");
const supabase = require("../../config/storageConnection");
const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const getAllWorkshopPeserta = async (req, res) => {
  try {
    const workshopId = req.params.id;

    const workshop = await Workshop.findById(workshopId).populate({
      path: "peserta",
      populate: {
        path: "idUser", // Adjust the path to match your schema
        model: "User",
      },
    });

    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found." });
    }

    res.status(200).json(workshop.peserta);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllWorkshopByUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("workshop");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json(user.workshop);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllWorkshop = async (req, res) => {
  try {
    const workshops = await Workshop.find({ date: { $exists: true } })
      .sort({ updatedAt: -1 })
      .exec();

    const paidWorkshops = workshops
      .filter((workshop) => workshop.price !== "0")
      .slice(0, 8)
      .map((workshop) => ({
        workshop,
        recommendation: "Paid Workshop",
      }));

    const freeWorkshops = workshops
      .filter((workshop) => workshop.price === "0")
      .slice(0, 8)
      .map((workshop) => ({
        workshop,
        recommendation: "Free Workshop",
      }));

    res.status(200).json({ paidWorkshops, freeWorkshops });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWorkshopById = async (req, res) => {
  try {
    const workshopId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
      return res.status(400).json({ error: "ID workshop tidak valid" });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ error: "Workshop tidak ditemukan" });
    }

    res.status(200).json(workshop);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createPeserta = async (req, res) => {
  try {
    const { question, phoneNumber } = req.body;
    const workshopId = req.params.id;
    const userId = req.user.id;

    if (!userId) {
      return res.status(404).json({ error: "You are not signed in" });
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    if (workshop.peserta.some((p) => p.idUser.equals(userId))) {
      return res
        .status(400)
        .json({ error: "You are already registered for this workshop" });
    }

    workshop.peserta.push({
      idUser: userId,
      phoneNumber: phoneNumber,
      question: question,
    });

    const updatedWorkshop = await workshop.save();

    res.status(200).json(updatedWorkshop);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      fasilitas,
      materi,
      tujuan,
      moderator,
      narasumber,
      date,
      startTime,
      endTime,
      timeZone,
      location,
      price,
    } = req.body;

    const poster = req.file;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Author not found" });
    }

    const { data, error } = await supabase.storage
      .from("storage")
      .upload(`image/${uuidv4()}-${poster.originalname}`, poster.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: poster.mimetype,
      });

    const urlPoster = supabase.storage.from("storage").getPublicUrl(data.path);

    const newWorkshop = new Workshop({
      title: title,
      poster: {
        url: urlPoster.data.publicUrl,
        path: data.path,
      },
      materi: materi,
      tujuan: tujuan,
      author: req.user.id,
      narasumber: narasumber,
      moderator: moderator,
      fasilitas: fasilitas,
      date: date,
      startTime: startTime,
      endTime: endTime,
      timeZone: timeZone,
      location: location,
      price: price,
    });

    const savedWorkshop = await newWorkshop.save();
    const workshopId = savedWorkshop._id;

    if (user) {
      user.workshop.push(workshopId);
      await user.save();
    }
    res.status(201).json({ savedWorkshop });
  } catch (error) {
    console.error(error);

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteWorkshop = async (req, res) => {
  try {
    const workshopId = req.params.id;
    const workshop = await Workshop.findById(workshopId);

    const { error } = await supabase.storage
      .from("storage")
      .remove([`${workshop.poster.path}`]);

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
      return res.status(400).json({ error: "ID workshop tidak valid" });
    }
    if (!workshop) {
      return res.status(404).json({ error: "workshop tidak ditemukan" });
    }

    if (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (req.user.id != workshop.author.toString()) {
      return res.status(400).json({ error: "Anda bukan pemilik workshop" });
    }

    const deletedWorkshop = await Workshop.findOneAndDelete({
      _id: workshopId,
    });

    const user = await User.findById(req.user.id);
    if (user) {
      user.workshop = user.workshop.filter(
        (item) => item._id.toString() !== workshopId
      );
      await user.save();
    }

    res
      .status(200)
      .json({ message: "Workshop berhasil dihapus", deletedWorkshop });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchWorkshop = async (req, res) => {
  const { q } = req.query;

  try {
    const workshops = await Workshop.find({
      title: { $regex: new RegExp(q, "i") },
    }).limit(4);

    res.json(workshops);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateWorkshop = async (req, res) => {
  try {
    const {
      title,
      fasilitas,
      materi,
      tujuan,
      moderator,
      narasumber,
      date,
      startTime,
      endTime,
      timeZone,
      location,
      price,
    } = req.body;

    const workshopId = req.params.id;
    const existingWorkshop = await Workshop.findById(workshopId);

    if (!existingWorkshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    updateWorkshopFields(existingWorkshop, {
      title,
      tujuan,
      fasilitas,
      moderator,
      materi,
      narasumber,
      date,
      startTime,
      endTime,
      timeZone,
      location,
      price,
    });

    await updateWorkshopPoster(existingWorkshop, req.file);

    const updatedWorkshop = await existingWorkshop.save();

    res
      .status(200)
      .json({ message: "Workshop updated successfully", updatedWorkshop });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateWorkshopFields = (workshop, fields) => {
  for (const [key, value] of Object.entries(fields)) {
    workshop[key] = value;
  }
};

const updateWorkshopPoster = async (workshop, newPoster) => {
  if (newPoster) {
    const deleteWorkshopPoster = await supabase.storage
      .from("storage")
      .remove([`${workshop.poster.path}`]);

    if (deleteWorkshopPoster.error) {
      throw new Error("Error deleting workshop file");
    }

    const { data, error } = await supabase.storage
      .from("storage")
      .upload(`image/${uuidv4()}-${newPoster.originalname}`, newPoster.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: newPoster.mimetype,
      });

    const urlPoster = supabase.storage.from("storage").getPublicUrl(data.path);

    workshop.poster = {
      url: urlPoster.data.publicUrl,
      path: data.path,
    };
  }
};

module.exports = {
  getAllWorkshopByUser,
  getWorkshopById,
  createWorkshop,
  deleteWorkshop,
  searchWorkshop,
  getAllWorkshop,
  createPeserta,
  updateWorkshop,
  getAllWorkshopPeserta,
};

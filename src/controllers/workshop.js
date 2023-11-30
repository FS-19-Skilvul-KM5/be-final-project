const User = require("../models/user");
const Workshop = require("../models/workshop");
const supabase = require("../../config/storageConnection");
const { default: mongoose } = require("mongoose");
const { v4: uuidv4 } = require("uuid");

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
      .filter((workshop) => workshop.price != "0")
      .map((workshop) => ({
        workshop,
        recommendation: "Paid Workshop",
      }));

    const freeWorkshops = workshops
      .filter((workshop) => workshop.price == "0")
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
    const workshopId = req.params.id;
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({ error: "You are not signed in" });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }

    if (workshop.peserta.includes(userId)) {
      return res
        .status(400)
        .json({ error: "You are already registered for this workshop" });
    }

    workshop.peserta.push(userId);
    await workshop.save();

    res.status(200).json(workshop);
  } catch (error) {
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

    existingWorkshop.title = title || existingWorkshop.title;
    existingWorkshop.fasilitas = fasilitas || existingWorkshop.fasilitas;
    existingWorkshop.materi = materi || existingWorkshop.materi;
    existingWorkshop.tujuan = tujuan || existingWorkshop.tujuan;
    existingWorkshop.moderator = moderator || existingWorkshop.moderator;
    existingWorkshop.narasumber = narasumber || existingWorkshop.narasumber;
    existingWorkshop.date = date || existingWorkshop.date;
    existingWorkshop.startTime = startTime || existingWorkshop.startTime;
    existingWorkshop.endTime = endTime || existingWorkshop.endTime;
    existingWorkshop.timeZone = timeZone || existingWorkshop.timeZone;
    existingWorkshop.location = location || existingWorkshop.location;
    existingWorkshop.price = price || existingWorkshop.price;

    const newPoster = req.file;

    if (newPoster) {
      const deleteWorkshopPoster = await supabase.storage
        .from("storage")
        .remove([`${existingWorkshop.poster.path}`]);

      if (deleteWorkshopPoster.error) {
        return res.status(500).json({ error: "Error deleting workshop file" });
      }

      const { data, error } = await supabase.storage
        .from("storage")
        .upload(
          `image/${uuidv4()}-${newPoster.originalname}`,
          newPoster.buffer,
          {
            cacheControl: "3600",
            upsert: false,
            contentType: newPoster.mimetype,
          }
        );

      const urlPoster = supabase.storage
        .from("storage")
        .getPublicUrl(data.path);

      existingWorkshop.poster = {
        url: urlPoster.data.publicUrl,
        path: data.path,
      };
    }

    const updatedWorkshop = await existingWorkshop.save();

    res
      .status(200)
      .json({ message: "Workshop updated successfully", updatedWorkshop });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
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
};

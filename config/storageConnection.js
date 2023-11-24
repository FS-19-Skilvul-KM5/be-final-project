const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.URL_SUPABASE,
  process.env.API_PUBLIC_SUPABASE
);

module.exports = supabase;

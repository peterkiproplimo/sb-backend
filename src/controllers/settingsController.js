const Settings = require("../models/Settings");

const SettingsResolver = {
    getSettings: async () => {
        try {
          const settings = await Settings.find();
          return settings;
        } catch (error) {
          throw new Error('Error fetching settings: ' + error.message);
        }
      },
      getSettingById: async (_, { id }) => {
        try {
          const setting = await Settings.findById(id);
          return setting;
        } catch (error) {
          throw new Error('Error fetching setting by ID: ' + error.message);
        }
      },
      createSetting: async ({ item, value }, req) => {
        try {
          const newSetting = new Settings({ item, value });
          const result = await newSetting.save();
          return result;
        } catch (error) {
          throw new Error('Error creating setting: ' + error.message);
        }
      },
      updateSetting: async ({ id, item, value }, req ) => {
        try {
            console.log({ id, item, value });
          const result = await Settings.findByIdAndUpdate(id, { item, value }, { new: true });
          return result;
        } catch (error) {
          throw new Error('Error updating setting: ' + error.message);
        }
      },
      deleteSetting: async (_, { id }) => {
        try {
          const result = await Settings.findByIdAndDelete(id);
          return result;
        } catch (error) {
          throw new Error('Error deleting setting: ' + error.message);
        }
      },
}

module.exports = SettingsResolver
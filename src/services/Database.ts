 import { MONGO_URI } from '../../config';
import mongoose, { ConnectOptions } from "mongoose";
export default async() => {

    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }as ConnectOptions)
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

}
  
  
 

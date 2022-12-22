import express , { Application } from 'express';
import path from 'path';

import {AdminRoute, DeliveryRoute, VandorRoute} from '../routes'
import { CustomerRoute } from '../routes/CustomerRoute';
import { ShoppingRoute } from '../routes/ShoppingRoutes';
import { PaymentRoute } from '../routes/PaymentRoute';
 

export default async(app: Application) => {

    app.use(express.json({limit: '25mb'}));
    app.use(express.urlencoded({ extended: true,limit: '25mb'}))
    
    app.use(express.json());
 
    const imagePath = path.join(__dirname,'../images');
    const profilesPath = path.join(__dirname,'../profiles');
    
    app.use('/images', express.static(imagePath));
    app.use('/profiles', express.static(profilesPath));
    
    app.use('/admin', AdminRoute);
    app.use('/vendor', VandorRoute)
    app.use('/customer', CustomerRoute)
    app.use('/delivery', DeliveryRoute);
    app.use('/payments', PaymentRoute);
    app.use(ShoppingRoute);

    return app;

}

   
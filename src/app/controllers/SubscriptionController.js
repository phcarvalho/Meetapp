import { Op } from 'sequelize';
import { startOfHour, endOfHour } from 'date-fns';
import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

import NotificationMail from '../jobs/NotificationEmail';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const subscription = await Subscription.findOne({
      where: {
        user_id: req.userId,
        meetup_id: req.params.id,
      },
    });

    console.log(subscription);

    if (subscription) {
      return res
        .status(400)
        .json({ error: 'You are already subscribed in this meetup' });
    }

    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (meetup.past) {
      return res
        .status(400)
        .json({ error: "You can't subscribe in a past meetup" });
    }

    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "You can't subscribe to your own meetups" });
    }

    const userSubscription = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          where: {
            date: {
              [Op.between]: [startOfHour(meetup.date), endOfHour(meetup.date)],
            },
          },
        },
      ],
    });

    const user = await User.findByPk(req.userId, {
      attributes: ['name', 'email'],
    });

    if (userSubscription) {
      return res
        .status(400)
        .json({ error: "You can't attend two meetups at the same time" });
    }

    const newSubscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: req.params.id,
    });

    await Queue.add(NotificationMail.key, {
      meetup,
      user,
    });

    return res.json(newSubscription);
  }
}

export default new SubscriptionController();

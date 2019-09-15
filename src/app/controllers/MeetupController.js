import * as Yup from 'yup';
import { parseISO, isBefore } from 'date-fns';
import File from '../models/File';
import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      banner_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      res.status(400).json({ error: 'Validation fails' });
    }

    const { date, banner_id } = req.body;

    /**
     * Check for past dates
     */
    const checkDate = parseISO(date);

    if (isBefore(checkDate, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    /**
     * Check banner file
     */
    const file = await File.findByPk(banner_id);

    if (!file) {
      return res.status(400).json({ error: 'This file does not exist' });
    }

    req.body.user_id = req.userId;

    const meetup = await Meetup.create(req.body);

    return res.json(meetup);
  }

  async index(req, res) {
    const { page = 1 } = req.query;

    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(meetups);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      banner_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json('Validation fails');
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.past) {
      res.status(400).json("You can't change past meetup's informations");
    }

    const { date, banner_id } = req.body;

    if (date && date !== meetup.date) {
      const checkDate = parseISO(date);

      if (isBefore(checkDate, new Date())) {
        return res.status(400).json({ error: 'Past dates are not permitted' });
      }
    }

    if (banner_id && banner_id !== meetup.banner_id) {
      const file = await File.findByPk(banner_id);

      if (!file) {
        return res.status(400).json({ error: 'This file does not exist' });
      }
    }

    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (meetup.user_id !== req.userId) {
      return res
        .status(401)
        .json("You don't have permission to cancel this meetup");
    }

    const { title, location, past } = meetup;

    if (past) {
      res.status(400).json("You can't cancel a past meetup");
    }

    await meetup.destroy();

    return res.json(`The meetup "${title}" at "${location}" has been canceled`);
  }
}

export default new MeetupController();

import Mail from '../../lib/Mail';

class NotificationMail {
  get key() {
    return 'NotificationMail';
  }

  async handle({ data }) {
    const { meetup, user } = data;

    await Mail.sendMail({
      to: `${meetup.user.name} <${meetup.user.email}>`,
      subject: 'Novo usuário inscrito no evento',
      template: 'notify',
      context: {
        meetupOwner: meetup.user.name,
        meetupTitle: meetup.title,
        userName: user.name,
        userEmail: user.email,
      },
    });
  }
}

export default new NotificationMail();

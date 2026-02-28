import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { InMemoryDbService, RequestInfo, STATUS } from 'angular-in-memory-web-api';
import { from, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { find, map, switchMap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { base64, currentTimestamp, filterObject, User } from '@core/authentication';
import { UserRole } from '@shared/enums/userRole.enums';

class JWT {
  generate(user: User) {
    const expiresIn = 3600;
    const refreshTokenExpiresIn = 86400;

    return filterObject({
      access_token: this.createToken(user, expiresIn),
      token_type: 'bearer',
      expires_in: user['refresh_token'] ? expiresIn : undefined,
      refresh_token: user['refresh_token']
        ? this.createToken(user, refreshTokenExpiresIn)
        : undefined,
    });
  }

  getUser(req: HttpRequest<any>) {
    let token = '';

    if (req.body?.refresh_token) {
      token = req.body.refresh_token;
    } else if (req.headers.has('Authorization')) {
      const authorization = req.headers.get('Authorization');
      const result = (authorization as string).split(' ');
      token = result[1];
    }

    try {
      const now = new Date();
      const data = JWT.parseToken(token);

      return JWT.isExpired(data, now) ? null : data.user;
    } catch (e) {
      return null;
    }
  }

  createToken(user: User, expiresIn = 0) {
    const exp = user['refresh_token'] ? currentTimestamp() + expiresIn : undefined;

    return [
      base64.encode(JSON.stringify({ typ: 'JWT', alg: 'HS256' })),
      base64.encode(JSON.stringify(filterObject(Object.assign({ exp, user })))),
      base64.encode('skillbridge'),
    ].join('.');
  }

  private static parseToken(accessToken: string) {
    const [, payload] = accessToken.split('.');

    return JSON.parse(base64.decode(payload));
  }

  private static isExpired(data: any, now: Date) {
    const expiresIn = new Date();
    expiresIn.setTime(data.exp * 1000);
    const diff = this.dateToSeconds(expiresIn) - this.dateToSeconds(now);

    return diff <= 0;
  }

  private static dateToSeconds(date: Date) {
    return Math.ceil(date.getTime() / 1000);
  }
}

const jwt = new JWT();

function is(reqInfo: RequestInfo, path: string) {
  if (environment.baseUrl) {
    return false;
  }

  return new RegExp(`${path}(/)?$`, 'i').test(reqInfo.req.url);
}

@Injectable({
  providedIn: 'root',
})
export class InMemDataService implements InMemoryDbService {
  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      password: 'skillbridge@123',
      name: 'Admin',
      email: 'admin@skillbridge.com',
      avatar: 'images/avatar.jpg',
      roleId: UserRole.Admin,
    },
    {
      id: 2,
      username: 'recca0120',
      password: 'password',
      name: 'John Doe',
      email: 'recca0120@gmail.com',
      avatar: 'images/heros/10.jpg',
      roleId: UserRole.User,
      refresh_token: true,
      profileComplete: true,
      dateOfBirth: '1998-05-15',
      gender: 'Male',
      educationLevel: 'University',
      phone: '+1 (555) 123-4567',
      country: 'United States',
      city: 'San Francisco',
      bio: 'Passionate software engineering student with a focus on full-stack development and UX design.',
      degrees: [
        {
          type: 'university',
          institution: 'FAST-NUCES',
          degree: 'BS Computer Science',
          yearBatch: 4,
          major: 'Software Engineering',
        },
      ],
      skills: ['TypeScript', 'Angular', 'Node.js', 'Python', 'UX Research', 'Figma'],
      careerInterests: ['Technology', 'Healthcare', 'Design'],
      courseSkills: ['Responsive Design', 'Data Structures', 'Agile Methodology'],
      assessment: {
        openness: 85,
        conscientiousness: 70,
        extraversion: 60,
        agreeableness: 90,
        neuroticism: 40,
      },
    },
  ];

  createDb(
    reqInfo?: RequestInfo
  ):
    | Record<string, unknown>
    | Observable<Record<string, unknown>>
    | Promise<Record<string, unknown>> {
    return { users: this.users };
  }

  get(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;

    if (is(reqInfo, 'user/menu')) {
      return ajax('data/menu.json?_t=' + Date.now()).pipe(
        map((response: any) => {
          return { headers, url, status: STATUS.OK, body: { menu: response.response.menu } };
        }),
        switchMap(response => reqInfo.utils.createResponse$(() => response))
      );
    }

    if (is(reqInfo, 'user')) {
      const user = jwt.getUser(reqInfo.req as HttpRequest<any>);
      const result = user
        ? { status: STATUS.OK, body: user }
        : { status: STATUS.UNAUTHORIZED, body: {} };
      const response = Object.assign({ headers, url }, result);

      return reqInfo.utils.createResponse$(() => response);
    }

    return;
  }

  put(reqInfo: RequestInfo) {
    if (is(reqInfo, 'user/profile') || is(reqInfo, 'user/academic') || is(reqInfo, 'user/skills')) {
      return this.updateUser(reqInfo);
    }
    return;
  }

  post(reqInfo: RequestInfo) {
    if (is(reqInfo, 'auth/login')) {
      return this.login(reqInfo);
    }

    if (is(reqInfo, 'auth/register')) {
      return this.register(reqInfo);
    }

    if (is(reqInfo, 'auth/refresh')) {
      return this.refresh(reqInfo);
    }

    if (is(reqInfo, 'auth/logout')) {
      return this.logout(reqInfo);
    }

    if (is(reqInfo, 'user/assessment')) {
      return this.updateUser(reqInfo);
    }

    return;
  }

  private login(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;
    const req = reqInfo.req as HttpRequest<any>;
    const { username, password } = req.body;

    return from(this.users).pipe(
      find(user => user['username'] === username || user.email === username),
      map(user => {
        if (!user) {
          return { headers, url, status: STATUS.UNAUTHORIZED, body: {} };
        }

        if (user['password'] !== password) {
          const result = {
            status: STATUS.UNPROCESSABLE_ENTRY,
            error: { errors: { password: ['The provided password is incorrect.'] } },
          };

          return Object.assign({ headers, url }, result);
        }

        const currentUser = Object.assign({}, user);
        delete currentUser['password'];
        return { headers, url, status: STATUS.OK, body: jwt.generate(currentUser) };
      }),
      switchMap(response => reqInfo.utils.createResponse$(() => response))
    );
  }

  private refresh(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;
    const user = jwt.getUser(reqInfo.req as HttpRequest<any>);
    const result = user
      ? { status: STATUS.OK, body: jwt.generate(user) }
      : { status: STATUS.UNAUTHORIZED, body: {} };
    const response = Object.assign({ headers, url }, result);

    return reqInfo.utils.createResponse$(() => response);
  }

  private logout(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;
    const response = { headers, url, status: STATUS.OK, body: {} };

    return reqInfo.utils.createResponse$(() => response);
  }

  private register(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;
    const req = reqInfo.req as HttpRequest<any>;
    const { fullName, email, password } = req.body;

    const newUser: User = {
      id: this.users.length + 1,
      username: email, // mock logic
      name: fullName,
      email,
      password,
      roleId: UserRole.User,
      profileComplete: false,
    };

    this.users.push(newUser);

    console.log('newUser', newUser);

    const currentUser = Object.assign({}, newUser);
    delete currentUser['password'];

    // In our app, after register we don't automatically login but we return success
    const result = { status: STATUS.OK, body: {} };
    const response = Object.assign({ headers, url }, result);
    return reqInfo.utils.createResponse$(() => response);
  }

  private updateUser(reqInfo: RequestInfo) {
    const { headers, url } = reqInfo;
    const req = reqInfo.req as HttpRequest<any>;
    const tokenUser = jwt.getUser(req);

    if (!tokenUser) {
      const response = { headers, url, status: STATUS.UNAUTHORIZED, body: {} };
      return reqInfo.utils.createResponse$(() => response);
    }

    const userIndex = this.users.findIndex(u => u.id === tokenUser.id);
    if (userIndex > -1) {
      // Simplistic mock: just merge the request body into the user object
      this.users[userIndex] = { ...this.users[userIndex], ...req.body };

      // If this is the final assessment, mark profileComplete
      if (is(reqInfo, 'user/assessment')) {
        this.users[userIndex].profileComplete = true;
      }
    }

    const response = { headers, url, status: STATUS.OK, body: {} };
    return reqInfo.utils.createResponse$(() => response);
  }
}

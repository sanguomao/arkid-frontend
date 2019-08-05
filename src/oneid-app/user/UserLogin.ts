import {Vue, Component, Prop} from 'vue-property-decorator';
import {User} from '@/models/oneid';
import * as api from '@/services/oneid';
import {Form} from 'iview/types/index';
import {FORM_RULES} from '@/utils';
import './UserCommon.less';


@Component({
  template: html`
<SimpleFrame>
  <div class="ui-login-page">
    <div class="ui-login-page--form-wrapper">
      <Form ref="form" :model="form" :label-width="120" :rules="formRules" class="form"
        autocomplete="off"
      >
        <FormItem label="选择登陆方式:">
          <RadioGroup class="login-type flex-row" v-model="form.selectedLoginType" @on-change="onLoginTypeChange">
            <Radio v-for="item in loginType" :label="item">
                <span>{{ item }}</span>
            </Radio>
          </RadioGroup>
        </FormItem>
        <FormItem prop="accountname" :label="form.selectedLoginType + ':'">
          <Input type="text" v-model="form.accountname"></Input>
        </FormItem>
        <FormItem prop="password" label="密码:">
          <Input type="password" v-model="form.password"></Input>
          <RouterLink v-if="isResetPasswordEnable" :to="{name: 'oneid.password'}" class="forget">忘记密码</RouterLink>
        </FormItem>
        <FormItem>
          <Button class="simpleframe-btn" type="primary" @click="handleSubmit" style="width: 100%;">登录</Button>
          <RouterLink v-if="isRegisterEnabled" :to="{name: 'oneid.signup'}" class="simpleframe-route go-to">没有账号？去注册</RouterLink>
        </FormItem>
      </Form>
    </div>
  </div>
</SimpleFrame>
  `,
})
export default class UserLogin extends Vue {

  $refs!: {
    form: Form,
  };
  form = {
    selectedLoginType: '用户名',
    accountname: '',
    password: '',
  };
  formRules = {
    accountname: [FORM_RULES.required],
    password: [FORM_RULES.required],
  };
  user: User|null = null;

  get isRegisterEnabled() {
    return this.$app.metaInfo!.account.isRegisterEnabled;
  }

  get isResetPasswordEnable() {
    return this.$app.metaInfo!.account.isResetPasswordEnabled;
  }

  mounted() {
    this.loginStateCheck();
  }

  get loginType() {
    let loginTypes = ['用户名'];
    if (this.$app.metaInfo!.account.support_email) {
      loginTypes.push('邮箱');
    }

    if (this.$app.metaInfo!.account.support_mobile) {
      loginTypes.push('手机号');
    }
    return loginTypes;
  }

  loginStateCheck() {
    if (this.$app.isLogin) {
      this.$app.goHome();
    }
  }

  onLoginTypeChange() {
    this.$refs.form.resetFields();
  }

  async login() {
    const {form} = this;
    try {
      let params = {password: form.password};
      if (form.selectedLoginType == this.loginType[0]) {
        params['username'] = form.accountname;
      }
      else if(form.selectedLoginType.includes('邮箱')) {
        params['private_email'] = form.accountname;
      }
      else {
        params['mobile'] = form.accountname;
      }
      const user = await api.login(params);
      this.user = user;
      this.$Message.success('登录成功');
    } catch(err) {
      console.log(err);
      this.$Message.error('登录失败');
      return;
    }
    this.doLogin();
  }

  doLogin() {
    let {next} = this.$route.query;
    if (next && typeof next === 'string'){
      next = next.replace('_authorize', 'authorize');
      const urlParams = new URLSearchParams(next)
      if (urlParams.get('oneid_token')){
        next = next.replace('oneid_token', '_oneid_token');
      }
      window.location.href = next;
      return;
    }

    this.$app.onLogin({
      isLogin: true,
      ...this.user,
    });

    const {backPath} = this.$route.query;
    if (backPath && typeof backPath === 'string') {
      this.$router.push(backPath);
    } else {
      this.$app.goHome();
    }
  }

  handleSubmit() {
    this.$refs.form.validate((valid: boolean) => {
      if (valid) {
        this.login();
      }
    });
  }

}
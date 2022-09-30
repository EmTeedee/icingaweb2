<?php
/* Icinga Web 2 | (c) 2013 Icinga Development Team | GPLv2+ */

namespace Icinga\Controllers;

use Icinga\Web\Controller\ActionController;
use Icinga\Web\Url;

/**
 * Application wide index controller
 */
class IndexController extends ActionController
{
    /**
     * Use a default redirection rule to welcome page
     */
    public function preDispatch()
    {
        if ($this->getRequest()->getActionName() !== 'welcome') {
            $globalConfig = Icinga::app()->getConfig()->getSection('global');
            $landingPage = $globalConfig->get('landing_page', 'dashboard');

            // @TODO(el): Avoid landing page redirects: https://dev.icinga.com/issues/9656
            $this->redirectNow(Url::fromRequest()->setPath($landingPage));
        }
    }

    /**
     * Application's start page
     */
    public function welcomeAction()
    {
    }
}
